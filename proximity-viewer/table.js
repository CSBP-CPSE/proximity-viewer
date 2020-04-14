import Templated from '../basic-tools/components/templated.js';
import Core from '../basic-tools/tools/core.js';
import Dom from '../basic-tools/tools/dom.js';
import Net from "../basic-tools/tools/net.js";
import Util from "../basic-tools/tools/util.js";

export default Core.Templatable("Basic.Components.Table", class Table extends Templated {

	set caption(value) { this.Node('caption').innerHTML = value; }

	constructor(container, options) {	
		super(container, options);
		
		this.summary = options.summary;
		
		// For last column, replace by label. Super ugly.
		this.field = options.field;
		
		this.current = {
			item : null,
			page : 1,
			max : null
		}

		this.Node('prev').addEventListener('click', this.OnButtonPrev_Handler.bind(this));
		this.Node('next').addEventListener('click', this.OnButtonNext_Handler.bind(this));
	}

	Template() {
		return "<div class='table-widget'>" +
				  "<h2 handle='title'>nls(Table_Title_Temp)</h2>" +
				  
			      "<div handle='message' class='table-message'>nls(Table_Message)</div>"+
				  
			      "<div handle='table' class='table-container hidden'>" + 
				     "<div class='navigation'>" + 
					    "<button handle='prev' title='nls(Table_Previous_Button)' disabled><img src='assets/arrow-left.png'></button>"+
					    "<span handle='current' class='current'></span>"+ 
					    "<button handle='next' title='nls(Table_Next_Button)' disabled><img src='assets/arrow-right.png'></button>"+
				     "</div>" + 
				  
					 "<summary id='prx-table'>nls(Table_Summary)</summary>" +
				     "<table>" +
				        "<thead>" + 
				           "<tr>" + 
						      "<th>nls(Table_Field_DBUID)</th>" + 
						      "<th>nls(Table_Field_empl.idx)</th>" + 
						      "<th>nls(Table_Field_pharm.idx)</th>" + 
						      "<th>nls(Table_Field_child.idx)</th>" + 
						      "<th>nls(Table_Field_health.idx)</th>" + 
						      "<th>nls(Table_Field_groc.idx)</th>" + 
						      "<th>nls(Table_Field_edupri.idx)</th>" + 
						      "<th>nls(Table_Field_edusec.idx)</th>" + 
						      "<th>nls(Table_Field_lib.idx)</th>" + 
						      "<th>nls(Table_Field_parks.idx)</th>" + 
						      "<th>nls(Table_Field_trans.idx)</th>" + 
						      "<th>nls(Table_Field_close)</th>" + 
						   "</tr>" + 
				        "</thead>" +
				        "<tbody handle='body'></tbody>" + 
				     "</table>" + 
			      "</div>" + 
			   "</div>"
	}

	GetDataFileUrl(file) {
		var url = window.location.href.split("/");
		
		url.splice(url.length - 1, 1);
		url.push(file);
		
		return url.join("/");
	}

	//Update the table content with the correct data of the DBU
	Populate(item, data) {
		this.Node("title").innerHTML = Core.Nls("Table_Title", [item.label]);
		
		Dom.Empty(this.Node('body'));

		data.shift();

		data.forEach(rData => {
			if (rData.length == 0) return;
			
			var row = Dom.Create("tr", { className:"table-row" }, this.Node('body'));
			
			rData.forEach((cData, i) => {				
				Dom.Create("td", { innerHTML:cData, className:"table-cell" }, row);
			});
		});
		
		this.RenderLastColumn()
	}
	
	// TODO: This is a lazy workaround to a proper table. Only works for this application. Table is already application level anyway.
	RenderLastColumn(idx, delegate) {
		var rows = this.Node("body").children;
		
		for (var i = 0; i < rows.length; i++) {		
			var cell = rows[i].children[11];
			var value = cell.innerHTML;
			
			var look = this.field.lookup[value];
			
			cell.innerHTML = (look == undefined) ? value : look[Core.locale];
		}
	}
	
	/**
	* Update the table with the correct DBUID data 
	*
	* Parameters :
	* item : the item that was used in the search bar
	* Return : none
	*/
	UpdateTable(item, page) {	
		// Set current DB
		this.current.page = page || 1;
		this.current.item = item;
		this.current.max = this.summary[item.id] || 1;

		// Get CSV file for selected DB. Extension is json because of weird server configuration. Content is csv.		
		var file = `data/${this.current.item.id}_${this.current.page}.json`;
		var url = this.GetDataFileUrl(file);	
		
		return Net.Request(url).then(ev => {
			var data = Util.ParseCsv(ev.result);
			
			this.Populate(item, data);
			
			// Update table UI
			this.Node('current').innerHTML = Core.Nls("Table_Current_Page", [this.current.page, this.current.max]);
			
			this.ToggleButtons();
			
			Dom.ToggleCss(this.Node("message"), "hidden", true);
			Dom.ToggleCss(this.Node("table"), "hidden", false);
			
		}, this.OnAsyncFailure);
	}

	ToggleButtons() {
		this.Node('prev').disabled = (this.current.page <= 1);
		this.Node('next').disabled = (this.current.page >= this.current.max);
	}

	OnButtonPrev_Handler(ev) {
		this.current.page--;
		
		this.UpdateTable(this.current.item, this.current.page);
	}

	OnButtonNext_Handler(ev) {
		this.current.page++;
		
		this.UpdateTable(this.current.item, this.current.page);
	}
	
	OnAsyncFailure(ev) {
		console.log(ev.error.toString());
	}
})