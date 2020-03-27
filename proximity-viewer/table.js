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
		
		this.current = {
			id : null,
			page : 1,
			max : null
		}

		this.Node('prev').addEventListener('click', this.OnButtonPrev_Handler.bind(this));
		this.Node('next').addEventListener('click', this.OnButtonNext_Handler.bind(this));
	}

	Template() {
		return "<div class='table-widget'>" +
				  "<h2>nls(Table_Title)</h2>" +
				  
			      "<div handle='message' class='table-message'>nls(Table_Message)</div>"+
				  
			      "<div handle='table' class='table-container hidden'>" + 
				     "<div class='navigation'>" + 
					    "<button handle='prev' title='nls(Table_Previous_Button)' disabled><img src='assets/arrow-left.png'></button>"+
					    "<span handle='current' class='current'></span>"+ 
					    "<button handle='next' title='nls(Table_Next_Button)' disabled><img src='assets/arrow-right.png'></button>"+
				     "</div>" + 
				  
				     "<table summary='nls(Table_Summary)'>" +
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
	Populate(data) {
		Dom.Empty(this.Node('body'));

		data.shift();

		data.forEach(rData => {
			if (rData.length == 0) return;
			
			var row = Dom.Create("tr", { className:"table-row" }, this.Node('body'));
			
			rData.forEach(cData => {
				Dom.Create("td", { innerHTML:cData, className:"table-cell" }, row);
			});
		});
	}
	
	/**
	* Update the table with the correct DBUID data 
	*
	* Parameters :
	* id : the DBUID that was used in the search bar
	* Return : none
	*/
	UpdateTable(id, page) {
		//var active = document.activeElement;
		// Disable buttons while data is being retrieved, prevent abusive clicking
		// TODO : Probably not necessary
		// this.DisableButtons();
		
		// Set current DB
		this.current.page = page || 1;
		this.current.id = id;
		this.current.max = this.summary[id] || 1;

		// Get CSV file for selected DB
		var file = `data/${this.current.id}_${this.current.page}.csv`;
		var url = this.GetDataFileUrl(file);	
		
		Net.Request(url).then(ev => {
			var data = Util.ParseCsv(ev.result);
			
			this.Populate(data);
			
			// Update table UI
			this.Node('current').innerHTML = Core.Nls("Table_Current_Page", [this.current.page, this.current.max]);
			
			this.ToggleButtons();
			
			Dom.ToggleCss(this.Node("message"), "hidden", true);
			Dom.ToggleCss(this.Node("table"), "hidden", false);
			
			// active.focus();
		}, this.OnAsyncFailure);
	}

	/*
	DisableButtons() {
		this.Node('prev').disabled = true;
		this.Node('next').disabled = true;
	}
	*/
	
	ToggleButtons() {
		this.Node('prev').disabled = (this.current.page <= 1);
		this.Node('next').disabled = (this.current.page >= this.current.max);
	}

	OnButtonPrev_Handler(ev) {
		this.current.page--;
		
		this.UpdateTable(this.current.id, this.current.page);
	}

	OnButtonNext_Handler(ev) {
		this.current.page++;
		
		this.UpdateTable(this.current.id, this.current.page);
	}
	
	OnAsyncFailure(ev) {
		console.log(ev.error.toString());
	}
})