"""
Name: preprocess_data.py
Description: Preprocess the Dissemination blocks (DB) data for generating mbtiles files.
  * DB features will have geometries made valid
  * Feature simplification (defined by SIMPLIFICATION constant)
  * Update CRS to EPSG:3857
  * Drop fields that are not required in final mbtiles outputs
  * Split data into two parts (required to output mbtiles which are <300MB in size)
  * Generate vector layers with different feature density (used to improve mbtiles appearance)
  * Create ogr2ogr CONF json files for generating mbtiles
"""
import json
import os
import pandas as pd
import geopandas as gpd
from pathlib import Path, PurePath

DB_DATA_PATH = "./source/DB/ldb_000b21a_e.shp"
PMD_DATA_PATH = "./source/PMD/PMD-en.csv"
SIMPLIFICATION = 10

# Note: Thresholds define what features to exclude based on area. Higher area threshold values
# will result in fewer features (i.e., dropping smaller area features) being included at different
# zoom levels. This staggering of feature inclusion increases the number of features which are
# visible at different zoom levels, while also excluding smaller features which would be hard to see
# or select at lower zoom levels.
VERY_LOW_ZOOM_AREA_THRESHOLD = 50000000
LOW_ZOOM_AREA_THRESHOLD = 30000000
LOW_MID_ZOOM_AREA_THRESHOLD = 5000000
MID_ZOOM_AREA_THRESHOLD_1 = 2000000
MID_ZOOM_AREA_THRESHOLD_2 = 600000
HIGH_MID_ZOOM_AREA_THRESHOLD = 100000
HIGH_ZOOM_AREA_THRESHOLD = 30000

# Create output dir if it doesn't exist
cPath = PurePath("./output")
Path(cPath).mkdir(parents=True, exist_ok=True)

# Delete old GPKG outputs
print("Removing old exports ...")
if os.path.exists("./output/pmd-2021-pt1.gpkg"):
    os.remove("./output/pmd-2021-pt1.gpkg")

if os.path.exists("./output/pmd-2021-pt2.gpkg"):
    os.remove("./output/pmd-2021-pt2.gpkg")

# Load input data
print("Loading input data ...")
db_gdf = gpd.read_file(DB_DATA_PATH)
pmd_df = pd.read_csv(PMD_DATA_PATH)

# Drop all columns except those required
print("Dropping columns not required in datasets...")
db_required_cols = ["DBUID", "geometry"]
db_gdf = db_gdf[db_required_cols]
pmd_required_cols = ["PRUID", "CSDUID", "DBUID", "prox_idx_emp", "prox_idx_pharma",
                     "prox_idx_childcare", "prox_idx_health", "prox_idx_grocery",
                     "prox_idx_educpri", "prox_idx_educsec", "prox_idx_lib", "prox_idx_parks",
                     "prox_idx_transit", "amenity_dense"]
pmd_df = pmd_df[pmd_required_cols]

# Update column type to allow attribute match and join
db_gdf["DBUID"] = db_gdf["DBUID"].apply(int)

# Join PMD data with DB data
print("Joining PMD data with DB boundaries ...")
db_gdf = db_gdf.merge(pmd_df, on="DBUID", how="left")

# Simplify geometries with a tolerance value in metres
print("Simplify geometries ...")
db_gdf['geometry'] = db_gdf['geometry'].simplify(SIMPLIFICATION).buffer(0)

# Ensure geometries are valid
print("Ensuring geometries are valid ...")
db_gdf['geometry'] = db_gdf['geometry'].make_valid()

# Reproject Data to EPSG:3857
print("Reprojecting data to EPSG:3857 ...")
db_gdf = db_gdf.to_crs(3857)

# Split data into two parts
# Note: This is required to keep the file size of the mbtiles under 300 MB
print("Splitting PMD data into two parts ...")
db_gdf_pt1 = db_gdf[db_gdf["PRUID"].isin([10, 11, 12, 13, 24, 35, 46, 59])]
db_gdf_pt2 = db_gdf[db_gdf["PRUID"].isin([47, 48, 60, 61, 62])]

# Drop PRUID column from dataframes
print("Dropping PRUID column  ...")
db_gdf_pt1 = db_gdf_pt1.drop(columns=["PRUID"])
db_gdf_pt2 = db_gdf_pt2.drop(columns=["PRUID"])

# Split PMD data based on different zoom levels
print("Splitting data up by zoom levels ...")
db_gdf_pt1_z2_z5 = db_gdf_pt1[db_gdf_pt1.area >= LOW_ZOOM_AREA_THRESHOLD]
db_gdf_pt1_z5_z7 = db_gdf_pt1[db_gdf_pt1.area >= LOW_MID_ZOOM_AREA_THRESHOLD]
db_gdf_pt1_z7_z8 = db_gdf_pt1[db_gdf_pt1.area >= MID_ZOOM_AREA_THRESHOLD_1]
db_gdf_pt1_z8_z9 = db_gdf_pt1[db_gdf_pt1.area >= MID_ZOOM_AREA_THRESHOLD_2]
db_gdf_pt1_z9_z10 = db_gdf_pt1[db_gdf_pt1.area >= HIGH_MID_ZOOM_AREA_THRESHOLD]
db_gdf_pt1_z10_z11 = db_gdf_pt1[db_gdf_pt1.area >= HIGH_ZOOM_AREA_THRESHOLD]
db_gdf_pt1_z11_z12 = db_gdf_pt1

# Export preprocessed geo-dataframe
print("Exporting data ...")

# Export layers to PMD 2021 pt 1 GPKG
db_gdf_pt1_z2_z5.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z2-z5", driver="GPKG")
db_gdf_pt1_z5_z7.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z5-z7", driver="GPKG")
db_gdf_pt1_z7_z8.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z7-z8", driver="GPKG")
db_gdf_pt1_z8_z9.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z8-z9", driver="GPKG")
db_gdf_pt1_z9_z10.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z9-z10", driver="GPKG")
db_gdf_pt1_z10_z11.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z10-z11", driver="GPKG")
db_gdf_pt1_z11_z12.to_file("./output/pmd-2021-pt1.gpkg", layer="pmd-pt1-z11-z12", driver="GPKG")

# Exporting PMD 2021 pt 2 GPKG
db_gdf_pt2.to_file("./output/pmd-2021-pt2.gpkg", layer="pmd-2021-pt2", driver="GPKG")

# Create ogr2ogr MVT config JSON files
# Note: Defining which features to show at different zoom levels, provides greater control over
# which features are dropped at different mbtiles zoom levels. To specify the config file in the
# mbtiles generation process you can use the ogr2ogr CONF parameter.

# Define configuration dictionaries
print("Generating ogr2ogr MVT CONF files ...")
pmd_2021_pt1_conf = {
    "pmd-pt1-z2-z5": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 2,
        "maxzoom": 5
    },
    "pmd-pt1-z5-z7": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 5,
        "maxzoom": 7
    },
    "pmd-pt1-z7-z8": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 7,
        "maxzoom": 8
    },
    "pmd-pt1-z8-z9": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 8,
        "maxzoom": 9
    },
    "pmd-pt1-z9-z10": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 9,
        "maxzoom": 10
    },
    "pmd-pt1-z10-z11": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 10,
        "maxzoom": 11
    },
    "pmd-pt1-z11-z12": {
        "target_name": "pmd-2021-pt1",
        "minzoom": 11,
        "maxzoom": 12
    }
}


# Convert Python dictionaries to JSON objects
json_pmd_2021_pt1_conf = json.dumps(pmd_2021_pt1_conf, indent=4)

# Export JSON configuration objects
with open("./output/pmd_2021_pt1_conf.json", "w") as pmd_pt1_conf:
    pmd_pt1_conf.write(json_pmd_2021_pt1_conf)

