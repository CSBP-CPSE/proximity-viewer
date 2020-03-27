export default class Store { 
		
	static get Map() {
		return localStorage.getItem("lode-map") || "trans";
	}
	
	static set Map(value) {
		localStorage.setItem("lode-map", value);
	}
	
	static get Lat() {
		return localStorage.getItem("lode-center-lat") || 45.4215;
	}
	
	static set Lat(value) {
		localStorage.setItem("lode-center-lat", value);
	}
	
	static get Lng() {
		return localStorage.getItem("lode-center-lng") || -75.6972;
	}
	
	static set Lng(value) {
		localStorage.setItem("lode-center-lng", value);
	}
	
	static get Zoom() {
		return localStorage.getItem("lode-zoom") || 11;
	}
	
	static set Zoom(value) {
		localStorage.setItem("lode-zoom", value);
	}
	
	static get Opacity() {
		return localStorage.getItem("lode-opacity") || 0.75;
	}
	
	static set Opacity(value) {
		localStorage.setItem("lode-opacity", value);
	}
	
	static get Layer() {
		return localStorage.getItem("lode-layer") || "da";
	}
	
	static set Layer(value) {
		localStorage.setItem("lode-layer", value);
	}
}