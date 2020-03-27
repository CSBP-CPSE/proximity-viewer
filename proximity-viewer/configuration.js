import Core from '../basic-tools/tools/core.js';

export default class Configuration {
	
	// Get for untransformed properties
	get ID() {
		return this.id;
	}
	
	get Style() {
		return this.style;
	}
	
	// Get for localized strings
	get Title() {
		return this.title;
	}
	
	get Banner() {
		return this.banner;
	}
	
	get Subtitle() {
		return this.subtitle;
	}
	
	get Description() {
		return this.description;
	}
	
	get Layers() {
		return this.layers;
	}
	
	// Get for transformed properties
	get LayerIDs() {
		var layers = this.Layers;
		
		return layers && layers.map(l => l.id);
	}
	
	get VisibleLayers() {
		var layers = this.Layers;
		
		return layers && layers.filter(l => (l.visible || l.visible === undefined));
	}
	
	get VisibleLayerIDs() {	
		var layers = this.VisibleLayers;
		
		return layers && layers.map(l => l.id);
	}
	
	get SelectedLayers() {
		var layers = this.Layers;
		
		return layers.filter(l => l.selected);
	}
	
	get SelectedLayerIDs()  {
		var layers = this.SelectedLayers;
		
		return layers && layers.map(l => l.id);
	}
	
	get Legend() {		
		return this.legend && this.legend.map(l => { 
			return { 
				color : l.color, 
				label : l.label && l.label[Core.locale], 
				value : l.value 
			} 
		});
	}
	
	get TOC() {		
		return this.toc && this.toc.map(t => { 
			return { 
				id : t.id,
				label : t.label && t.label[Core.locale]
			} 
		});
	}
	
	get Fields() {		
		return this.fields && this.fields.map(f => { 
			return { 
				id : f.id,
				label : f.label && f.label[Core.locale],
				polish : f.polish || null
			} 
		});
	}
	
	constructor() {
		this.id = null;
		this.style = null;
		this.layers = null;
		this.title = null;
		this.banner = null;
		this.subtitle = null;
		this.description = null;
		this.legend = null;
		this.toc = null;
		this.fields = null;
	}
	
	HasLayer(layerId) {
		for (var i=0; i < this.layers.length; i++) {
			if (this.layers[i].id === layerId) return true;
		}
		
		return false;
	}
	
	static FromJSON(json) {
		var c = new Configuration();
		
		c.id = json.id;
		c.style = json.style;
		c.title = json.title && json.title[Core.locale] || null;
		c.banner = json.banner && json.banner[Core.locale] || null;
		c.subtitle = json.subtitle && json.subtitle[Core.locale] || null;
		c.description = json.description && json.description[Core.locale] || null;
		c.layers = json.layers || null;
		c.legend = json.legend || null;
		c.toc = json.toc || null;
		c.fields = json.fields || null;
		
		return c;
	}
}