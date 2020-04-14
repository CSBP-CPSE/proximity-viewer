import Other from "../mapbox-tools/tools/other.js";	// TODO : yiich that name sucks
import Factory from "../mapbox-tools/tools/factory.js";
import Templated from "../basic-tools/components/templated.js";
import Core from "../basic-tools/tools/core.js";
import Net from "../basic-tools/tools/net.js";
import Util from "../basic-tools/tools/util.js";
import Dom from "../basic-tools/tools/dom.js";
import Table from "./table.js";
import Store from "./store.js";

export default class ProxApp extends Templated { 
	
	constructor(node, config) {
		super(node);
		
		this.config = config;
		this.current = this.config.maps[Store.Map];

		if (!this.current) this.current = Util.FirstProperty(this.config.maps);
		
		this.AddMap();	
		this.AddSearch();	
		this.AddBaseControls();		
		this.AddGroup();
		this.AddMenu();
		this.AddTable();
	}
	
	Template() {
		return "<div class='search-container'>" +
				  "<span class='wb-inv'>nls(Inv_Search_Instructions)</span>" + 
				  "<label class='search-label'>nls(App_Search_Label)" +
				     "<div handle='search' class='search'></div>" +
			      "</label>" +
				  "<div class='inv-container'>" +
					"<a href='#prx-table' class='wb-inv wb-show-onfocus wb-sl'>nls(Inv_Skip_Link)</a>" + 
				  "</div>" +
			   "</div>" +
			   "<div class='instructions'>nls(App_Instructions)</div>" + 
               "<div class='map-container'>" +
                  "<div handle='map' class='map'></div>" +
               "</div>" +
			   "<a href='nls(STS_Link)' class='link-symbols' target='_blank' title='nls(STS_Title)'>nls(STS_Label)</a>" + 
			   "<div class='table-container'>" +
				  "<div handle='table' class='table'></div>" +
			   "</div>"
	}

	AddMap() {
		var token = "pk.eyJ1IjoiZGVpbC1sZWlkIiwiYSI6ImNrMzZxODNvNTAxZjgzYm56emk1c3doajEifQ.H5CJ3maS0ZuxX_7QTgz1kg";
		var token2 = "sk.eyJ1IjoiZGVpbC1sZWlkIiwiYSI6ImNrNmNheGc4MTFhY3IzbW56dGRud3d5cTkifQ.thkLSPhvTVBjMy8QOZoTiA";
		
		this.map = Factory.Map(this.Node("map"), token, this.current.Style, [Store.Lng, Store.Lat], Store.Zoom);
		
		// Hooking up all events
		this.map.On("StyleChanged", this.OnMapStyleChanged_Handler.bind(this));
		this.map.On("MoveEnd", this.OnMapMoveEnd_Handler.bind(this));
		this.map.On("ZoomEnd", this.OnMapZoomEnd_Handler.bind(this));
		this.map.On("Click", this.OnMapClick_Handler.bind(this));
	}

	AddBaseControls() {
		var fullscreen = Factory.FullscreenControl(Core.Nls("FullScreen_Title"));
		var navigation = Factory.NavigationControl(false, true, Core.Nls("Navigation_ZoomIn_Title"), Core.Nls("Navigation_ZoomOut_Title"));
		var scale = Factory.ScaleControl("metric");
		
		this.map.AddControl(fullscreen, "top-left");
		this.map.AddControl(navigation, "top-left");
		this.map.AddControl(scale);
	}

	AddSearch() {
		this.config.search.items = this.config.search.items.map(i => {
			return { 
				id : i[0], 
				name : i[1],
				label : `${i[1]} (${this.FormatCSD(i[0])})`, 
				extent : [[i[2], i[3]], [i[4], i[5]]] 
			}
		});
		
		
		// Add top-left search bar
		var search = Factory.SearchControl(this.config.search.items, Core.Nls("Search_Placeholder"), Core.Nls("Search_Title"));
		
		search.Place(this.Node("search"));
		
		search.On("Change", this.OnSearchChange_Handler.bind(this));
		
		search.Node("typeahead").Node("input").focus();
	}

	AddGroup() {
		// Top-right group for legend, etc.		
		this.group = {
			legend : Factory.LegendControl(this.current.Legend, this.current.Title, this.current.Subtitle),
			opacity : Factory.OpacityControl(Store.Opacity),
			// download : Factory.DownloadControl(Net.FilePath("/assets/proximity-measures.csv"))
			download : Factory.DownloadControl(null)
		}
						
		this.map.AddControl(Factory.Group(this.group));
				
		this.group.opacity.On("OpacityChanged", this.OnLegend_OpacityChanged.bind(this));
	}
	
	AddMenu() {
		// Top-left menu below navigation
		var list = Factory.MapsListControl(this.config.maps);
		var bookmarks = Factory.BookmarksControl(this.config.bookmarks);
		
		this.menu = Factory.MenuControl();
		
		this.map.AddControl(this.menu, "top-left");
		
		this.menu.AddButton("home", "assets/globe.png", Core.Nls("Home_Title"), this.OnHomeClick_Handler.bind(this));
		this.menu.AddPopupButton("maps", "assets/layers.png", Core.Nls("Maps_Title"), list, this.map.Container);
		this.menu.AddPopupButton("bookmarks", "assets/bookmarks.png", Core.Nls("Bookmarks_Title"), bookmarks, this.map.Container);
		
		Dom.AddCss(this.menu.Button("maps").popup.Node("root"), "prx");
		Dom.AddCss(this.menu.Button("bookmarks").popup.Node("root"), "prx");
		
		Dom.AddCss(list.tooltip.Node("root"), "prx");
		
		list.On("MapSelected", this.OnListSelected_Handler.bind(this));
		bookmarks.On("BookmarkSelected", this.OnBookmarkSelected_Handler.bind(this));
	}
	
	AddTable() {
		this.table = new Table(this.Node("table"), { summary:this.config.table, currId: 0, currFile: 0, field: this.config.maps.close.Fields[2] });
	}
	
	OnLegend_OpacityChanged(ev) {		
		Store.Opacity = ev.opacity;
		
		this.map.Choropleth(["db"], 'fill-color', this.current.Legend, this.group.opacity.opacity);
	}
	
	OnHomeClick_Handler(ev) {
		this.map.FitBounds([[-173.457, 41.846], [-17.324, 75.848]]);
	}
	
	OnBookmarkSelected_Handler(ev) {
		this.menu.Button("bookmarks").popup.Hide();
		
		this.map.FitBounds(ev.item.extent, { animate:false });
	}
		
	OnListSelected_Handler(ev) {
		this.menu.Button("maps").popup.Hide();
		
		Store.Map = ev.id;

		// TODO : Check if SetStyle counts as a map load, if it does, we need to reset layer visibility and paint
		// properties instead of setting the style. If it doesn't we're good as is.
		this.map.SetStyle(ev.map.Style);
		
		this.current = ev.map;
		
		this.group.legend.Reload(this.current.Legend, this.current.Title, this.current.Subtitle);
	}
		
	OnMapStyleChanged_Handler(ev) {		
		this.map.SetClickableMap();
		this.map.Choropleth(["db"], 'fill-color', this.current.Legend, this.group.opacity.opacity)
	}
	
	OnMapMoveEnd_Handler(ev) {		
		Store.Lat = this.map.Center.lat;
		Store.Lng = this.map.Center.lng;
	}
	
	OnMapZoomEnd_Handler(ev) { 		
		Store.Zoom = this.map.Zoom;
	}
	
	OnMapClick_Handler(ev) {
		var features = this.map.QueryRenderedFeatures(ev.point, ["db", "csd-search"]);
				
		var db = null;
		var csd = null;
				
		features.forEach(f => {
			if (f.layer.id == "db") db = f;
			if (f.layer.id == "csd-search") csd = f;
		});
		
		if (!db || !csd) return;
		
		var item = null;
				
		this.config.search.items.forEach(i => {
			if (i.id == csd.properties.uid) item = i;
		});
		
		if (!item) return;
		
		// ie11 doesn't support find
		var item = this.config.search.items.filter(function (i) {
          return i.id === csd.properties.uid;
        })[0];
		
		this.table.UpdateTable(item);
		
		db.properties.DBUID = this.FormatDB(db.properties.DBUID);
		db.properties.CSDUID = this.FormatDB(db.properties.CSDUID);
		
		db.properties.CSDUID = `${csd.properties.name} (${db.properties.CSDUID})`;
		
		var html = Other.HTMLize(db.properties, this.current.Fields, Core.Nls("Map_Not_Available"));
		
		this.map.InfoPopup(ev.lngLat, html);
	}
	
	OnSearchChange_Handler(ev) {
		var legend = [{
			color : this.config.search.color,
			value : ["==", ["get", this.config.search.field], ev.item.id]
		}, {
			color : [255, 255, 255, 0]
		}];

		this.table.UpdateTable(ev.item);
		
		this.map.Choropleth(["csd-search"], 'fill-outline-color', legend, this.group.opacity.opacity);
		
		this.map.FitBounds(ev.item.extent, { padding:30, animate:false });
	}
	
	FormatDB(dbuid) {
		var csd = this.FormatCSD(dbuid);
		
		return `${csd}${dbuid.substr(7, 1)} ${dbuid.substr(8, 3)}`;
	}
	// CSD 35 06 008 and DB 35 06 0700 029

	FormatCSD(csduid) {
		return `${csduid.substr(0, 2)} ${csduid.substr(2, 2)} ${csduid.substr(4, 3)}`;
	}
}