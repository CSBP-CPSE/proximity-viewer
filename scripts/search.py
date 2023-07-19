"""
Name: search.py
Description: Script used to generate search configuration files, containing a
list of valid search items.
"""
import geopandas as gpd
import util as u
from pathlib import Path, PurePath


def project_to_epsg4326(gdf):
    """
    Ensure that geo-dataframe data is using EPSG:4326 as it's CRS
    :param gdf - Geopandas geo-dataframe
    """

    # Check current projection
    gdf_crs = gdf.crs

    if gdf_crs.srs != "epsg:4326":
        # Reproject to EPSG:4326 if not the current projection
        gdf = gdf.to_crs(4326)

    return gdf


def CreateSearchItems(options):
    """
    Generates the search items for the search bar
    :param options {dictionary} - contains the options for the generating the search data
    Options Examples:
    {
        "input": "input_file",
        "output": "output_file_name",
        "uid": "unique_id_column_name_of_search_location",
        "name": "name_column_of_search_location",
        "layer": "map_layer_name",
        "layeruid": "map_layer_uid"
    }
    """
    cPath = PurePath("./output", "./config")

    Path(cPath).mkdir(parents=True, exist_ok=True)

    # Load input data
    df = gpd.read_file(options['input'])

    # Ensure data is using the CRS EPSG:4326
    df = project_to_epsg4326(df)

    data = {"id": "search", "layer": options['layer'], "field": options['layeruid'], "color": [175, 30, 40, 1], "items": []}

    # Generate search items for each row in input
    for index, row in df.iterrows():
        bb = row.geometry.bounds
        line = [row[options['uid']], row[options['name']], u.Truncate(bb[0], 6), u.Truncate(bb[1], 6), u.Truncate(bb[2], 6), u.Truncate(bb[3], 6)]
        data["items"].append(line)

    # Dump generated search config file
    u.DumpJSON(cPath.joinpath(options['output']), data)


# Create search items
CreateSearchItems({
    "input": "./source/CSD/lcsd000b21a_e.shp",
    "output": "config.search.json",
    "uid": "CSDUID",
    "name": "CSDNAME",
    "layer": "csd-search-2021",
    "layeruid": "CSDUID"
})
