import { Other, Factory, Templated, Core, Net, Util, Dom, Store } from './web-mapping-components/web-mapping-components.js';
import Table from "./table.js";

/**
 * Main application class
 */
export default class ProxApp extends Templated {
	
	/**
	 * Prox App class constructor
	 * @constructor
	 * @param {object} node reference to dom element that will contain the proximity viewer app
	 * @param {object} config object containing data taken from various configuration json files
	 */
	constructor(node, config) {
		super(node);
		
		this.config = config;
		this.current = this.config.maps[Store.Map];
		this.maxExtent = [[-162.0, 41.0], [-32.0, 83.5]];

		if (!this.current) this.current = Util.FirstProperty(this.config.maps);
		
		this.AddMap();
		this.AddSearch();
		this.AddBaseControls();
		this.AddGroup();
		this.AddMenu();
		this.AddTable();
	}
	
	/**
	 * Template for the structure of the application, including;
	 * - search bar container
	 * - instruction container
	 * - map container
	 * - table container
	 * - link-symbols-container
	 */
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
				"<div class='table-container'>" +
					"<div handle='table' class='table'></div>" +
				"</div>" +
				"<div class='link-symbols-container'>" +
					"<a href='nls(STS_Link)' class='link-symbols' target='_blank' title='nls(STS_Title)'>nls(STS_Label)</a>" +
				"</div>";
	}

	/**
	 * Create and add a map with events handling for user interactions.
	 */
	AddMap() {
		let token;

		try {
			if (this.config.credentials
				&& this.config.credentials.mapbox
				&& this.config.credentials.mapbox.accessToken) {
				token = this.config.credentials.mapbox.accessToken;

			} else {
				throw 'Mapbox access token must be provided in config.credentials.json to generate a map';
			}

			this.map = Factory.Map(this.Node("map"), token, this.current.Style, [Store.Lng, Store.Lat], Store.Zoom);

			// Set the maximum bounds of the map
			this.map.SetMaxBounds(this.maxExtent);

			// Hooking up all events
			this.map.On("StyleChanged", this.OnMapStyleChanged_Handler.bind(this));
			this.map.On("MoveEnd", this.OnMapMoveEnd_Handler.bind(this));
			this.map.On("ZoomEnd", this.OnMapZoomEnd_Handler.bind(this));
			this.map.On("Click", this.OnMapClick_Handler.bind(this));

		} catch (err) {
			console.error(err);
		}
	}

	/**
	 * Create and add the following controls to the map
	 * - full screen button
	 * - navigation controls
	 * - scale bar
	 */
	AddBaseControls() {
		var fullscreen = Factory.FullscreenControl(Core.Nls("FullScreen_Title"));
		var navigation = Factory.NavigationControl(false, true,
			Core.Nls("Navigation_ZoomIn_Title"),
			Core.Nls("Navigation_ZoomOut_Title"));
		var scale = Factory.ScaleControl("metric");
		
		this.map.AddControl(fullscreen, "top-left");
		this.map.AddControl(navigation, "top-left");
		this.map.AddControl(scale);
	}

	/**
	 * Create and add a search bar for searching census sub-divisions
	 */
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
		var search = Factory.SearchControl(this.config.search.items,
			Core.Nls("Search_Placeholder"),
			Core.Nls("Search_Title"));
		
		search.Place(this.Node("search"));
		
		search.On("Change", this.OnSearchChange_Handler.bind(this));
	}

	/**
	 * Create a group containing map legend and opacity controls.
	 * Map legend is defined by legend items in the selected map config doc.
	 */
	AddGroup() {
		// Top-right group for legend, etc.
		this.group = {
			legend : Factory.LegendControl(this.current.Legend, this.current.Title, this.current.Subtitle),
			opacity : Factory.OpacityControl(Store.Opacity)
		}
						
		this.map.AddControl(Factory.Group(this.group));
		this.group.opacity.label = Core.Nls("Toc_Opacity");
		this.group.opacity.On("OpacitySliderChanged", this.OnOpacitySlider_Changed.bind(this));
	}
	
	/**
	 * Add a menu to the map with various buttons to control map content
	 */
	AddMenu() {
		// Top-left menu below navigation
		var maps = Factory.MapsListControl(this.config.maps, Core.Nls("Maps_Header"));
		var bookmarks = Factory.BookmarksControl(this.config.bookmarks,
			Core.Nls("Bookmarks_Header"),
			Core.Nls("Bookmarks_Description"));
		
		this.menu = Factory.MenuControl();
		
		this.map.AddControl(this.menu, "top-left");
		
		this.menu.AddButton("home",
			Core.root + "assets/globe.png",
			Core.Nls("Home_Title"),
			this.OnHomeClick_Handler.bind(this));
		this.menu.AddPopupButton("maps",
			Core.root + "assets/layers.png",
			Core.Nls("Maps_Title"),
			maps,
			this.map.Container);
		this.menu.AddPopupButton("bookmarks",
			Core.root + "assets/bookmarks.png",
			Core.Nls("Bookmarks_Title"),
			bookmarks,
			this.map.Container);
		
		Dom.AddClasses(this.menu.Button("maps").popup.Node("root"), "prx");
		Dom.AddClasses(this.menu.Button("bookmarks").popup.Node("root"), "prx");
		
		// Commented out to prevent an error occuring that prevents selecting map datasets.
		// Dom.AddClasses(maps.tooltip.Node("root"), "prx");
		
		maps.On("MapSelected", this.OnMapSelected_Handler.bind(this));
		bookmarks.On("BookmarkSelected", this.OnBookmarkSelected_Handler.bind(this));
	}
	
	AddTable() {
		Dom.Empty(this.Node("table"));

		Net.JSON(`${Core.root}${this.current.TableUrl}`).then(ev => {
			this.current.UpdateTable(ev.result);
			this.table = new Table(this.Node("table"), this.current.Table);
		});
	}
	
	/**
	 * OpacitySliderChanged event handler for when the opacity slider updates.
	 * @param {object} ev - Event object containing details on the opacity slider value
	 */
	OnOpacitySlider_Changed(ev) {
		Store.Opacity = ev.opacity;
		this.map.UpdateMapLayersWithLegendState(["pmd-2021-pt1", "pmd-2021-pt2"], this.group.legend, Store.Opacity);
	}
	
	/**
	 * Event handler for clicking the home menu button, which sets the map
	 * bounds to a Canadian extent.
	 * @param {object} ev - mouse event when clicking on the home menu button
	 */
	OnHomeClick_Handler(ev) {
		this.map.FitBounds([[-173.457, 41.846], [-17.324, 75.848]]);
	}
	
	/**
	 * Event handler for clicking a census metropolitan area listed in the
	 * bookmarks popup list.
	 * @param {object} ev - BookmarkSelected event containing the bookmark
	 * item and extent of the census metropolitan area.
	 */
	OnBookmarkSelected_Handler(ev) {
		this.menu.Button("bookmarks").popup.Hide();
		
		this.map.FitBounds(ev.item.extent, { animate:false });
	}
	
	/**
	 * Event handler for clicking a map item.
	 * @param {object} ev - MapSelected event containing the selected map id
	 * and related map configuration.
	 */
	OnMapSelected_Handler(ev) {
		this.menu.Button("maps").popup.Hide();
		
		Store.Map = ev.id;
		
		this.current = ev.map;
		
		this.map.SetStyle(this.current.Style);

		this.group.legend.Reload(this.current.Legend, this.current.Title, this.current.Subtitle);
	}
	
	/**
	 * Event handler which updates the map, when map styling changes on the map
	 * @param {object} ev - StyleChanged event object.
	 */
	OnMapStyleChanged_Handler(ev) {
		this.map.SetClickableMap();

		// Update styling colour and opacity of layers
		this.map.ApplyLegendStylesToMapLayers(["pmd-2021-pt1", "pmd-2021-pt2"], this.group.legend);
		this.map.UpdateMapLayersWithLegendState(["pmd-2021-pt1", "pmd-2021-pt2"], this.group.legend, Store.Opacity);
	}
	
	/**
	 * Event handler for when the map is panned, which updates the local
	 * storage of the lat/long values with the new map's center point values.
	 * @param {object} ev - MoveEnd event object.
	 */
	OnMapMoveEnd_Handler(ev) {
		Store.Lat = this.map.Center.lat;
		Store.Lng = this.map.Center.lng;
	}

	/**
	 * Event handler for when the map is zoomed, which updates the locally
	 * stored zoom value for the map.
	 * @param {object} ev - ZoomEnd event object.
	 */
	OnMapZoomEnd_Handler(ev) {
		Store.Zoom = this.map.Zoom;
	}
	
	/**
	 * Event handler for when the map is clicked, which queries map features at
	 * the click location and displays the feature details in a popup.
	 * stored zoom value for the map.
	 * @param {object} ev - Click event object.
	 */
	OnMapClick_Handler(ev) {
		var features = this.map.QueryRenderedFeatures(ev.point, ["pmd-2021-pt1", "pmd-2021-pt2"]);
		var pmd = null;
		var item = null;
		var DECIMALPLACES = 4;

		// Check if selected feature belongs to layers pmd-2021-pt1 or pmd-2021-pt2
		features.forEach(f => {
			if (f.layer.id == "pmd-2021-pt1" || f.layer.id == "pmd-2021-pt2") {
				pmd = f;
			}
		});
		
		// If no pmd feature selected, return false
		if (!pmd) return;
		
		// Get related CSD item details
		this.config.search.items.forEach(i => {
			if (i.id == pmd.properties.CSDUID) item = i;
		});
		
		// If no CSD item available, return false
		if (!item) return;
		
		// Update the table with records related to the CSD
		this.table.UpdateTable(item);
		
		// Format content displayed in the selected feature pop-up
		pmd.properties.DBUID = this.FormatDB(pmd.properties.DBUID);
		pmd.properties.CSDUID = this.FormatDB(pmd.properties.CSDUID);
		pmd.properties.CSDUID = `${item.name} (${pmd.properties.CSDUID})`;

		// Check if field values need to be classified by lookup or rounded to 4 decimal places
		for (let i = 0; i < this.current.Fields.length; i += 1) {
			let field = this.current.Fields[i];
			let field_value;
			if (Object.prototype.hasOwnProperty.call(field, 'lookup')) {
				if (field.lookup) {
					field_value = pmd.properties[field.id];
					if (!isNaN(Number(field_value))) {
						pmd.properties[field.id] = field.lookup[Number(field_value)][Core.locale];
					}
				} else {
					field_value = pmd.properties[field.id];
					if (!isNaN(Number(field_value))) {
						pmd.properties[field.id] = Number(field_value).toFixed(DECIMALPLACES);
					}
				}
			}
		}
		
		var html = Other.HTMLize(pmd.properties, this.current.Fields, Core.Nls("Map_Not_Available"));
		
		this.map.InfoPopup(ev.lngLat, html);
	}
	
	/**
	 * Update table with search items, add a boundary line for the census
	 * subdivision extent, and update map bounds with the extent of the
	 * searched census sub-division.
	 * Assumption : Search will always be by CSD
	 * @param {object} ev - Change event object, containing the search item details
	 */
	OnSearchChange_Handler(ev) {
		var legend = {
			config: [
				{
					color : this.config.search.color,
					value : ["==", ["get", this.config.search.field], ev.item.id]
				},
				{
					color : [255, 255, 255, 0]
				}
			]
		};

		this.table.UpdateTable(ev.item);
		this.map.ApplyLegendStylesToMapLayers([this.config.search.layer], legend);
		this.map.FitBounds(ev.item.extent, { padding:30, animate:false });
	}
	
	FormatDB(dbuid) {
		dbuid = String(dbuid)
		var csd = this.FormatCSD(dbuid);
		
		return `${csd}${dbuid.substr(7, 1)} ${dbuid.substr(8, 3)}`;
	}

	FormatCSD(csduid) {
		csduid = String(csduid)
		return `${csduid.substr(0, 2)} ${csduid.substr(2, 2)} ${csduid.substr(4, 3)}`;
	}
}
