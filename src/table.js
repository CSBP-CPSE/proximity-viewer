import { Templated, Core, Dom, Net, Util } from './web-mapping-components/web-mapping-components.js';

export default Core.Templatable("Basic.Components.Table", class Table extends Templated {

	set caption(value) { this.Node('caption').innerHTML = value; }

	constructor(container, options) {	
		super(container, options);
		
		this.summary = options.summary;
		this.fields = options.fields;
		this.current = {
			item : null,
			page : 1,
			max : null
		}

		this.Node('prev').addEventListener('click', this.OnButtonPrev_Handler.bind(this));
		this.Node('next').addEventListener('click', this.OnButtonNext_Handler.bind(this));

		// Add table header columns
		this.fields.forEach(f => this.AddHeader(f));
	}

	Template() {
		return "<div class='table-widget'>" +
				  "<h2 handle='title'>nls(Table_Title_Temp)</h2>" +
				  
			      "<div id='prx-table' handle='message' class='table-message'>nls(Table_Message)</div>"+
				  
			      "<div handle='table' class='table-container hidden'>" + 
					 "<summary>nls(Table_Summary)</summary>" +
				     "<table>" +
				        "<thead>" + 
				           "<tr handle='header'></tr>" + 
				        "</thead>" +
				        "<tbody handle='body'></tbody>" + 
				     "</table>" + 
				     "<div class='navigation'>" + 
					    "<button handle='prev' title='nls(Table_Previous_Button)' disabled><img src='assets/arrow-left.png'></button>"+
					    "<span handle='current' class='current'></span>"+ 
					    "<button handle='next' title='nls(Table_Next_Button)' disabled><img src='assets/arrow-right.png'></button>"+
				     "</div>" + 
			      "</div>" + 
			   "</div>"
	}

	/**
	 * Add a table header element to the table
	 * @param {object} f table field
	 */
	AddHeader(f) {
		Dom.Create("th", { innerHTML:f[Core.locale], className:f.type }, this.Node("header"));
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
				var value = cData;
				var field = this.fields[i]

				// Update values for fields which have their own classification lookup
				if (Object.prototype.hasOwnProperty.call(field, "lookup")) {
					if (!isNaN(Number(value))) {
						value = field.lookup[Number(value)][Core.locale];
					}
				}
				
				else if (i == 0) value = `${value.substr(0, 2)} ${value.substr(2, 2)} ${value.substr(4, 4)} ${value.substr(8, 3)}`;
				
				Dom.Create("td", { innerHTML:value, className:"table-cell" }, row);
			});
		});
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
			
			Dom.ToggleClass(this.Node("message"), "hidden", true);
			Dom.ToggleClass(this.Node("table"), "hidden", false);
			
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