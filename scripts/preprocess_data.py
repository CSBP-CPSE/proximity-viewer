"""
Name: preprocess_data.py
Description: Preprocess the Dissemination blocks (DB) data. DB features will
have geometries made valid, simplified, drop fields not required, and update
CRS to EPSG:4326.
"""
import pandas as pd
import geopandas as gpd
from pathlib import Path, PurePath

db_data_path = "./source/DB/ldb_000b21a_e.shp"
pmd_data_path = "./source/PMD/PMD-en.csv"

# Create output dir if it doesn't exist
cPath = PurePath("./output")
Path(cPath).mkdir(parents=True, exist_ok=True)

# Load input data
print("Loading input data ...")
db_gdf = gpd.read_file(db_data_path)
pmd_df = pd.read_csv(pmd_data_path)

# Drop all columns except those required
print("Dropping columns not required in datasets...")
db_required_cols = ["DBUID", "geometry"]
db_gdf = db_gdf[db_required_cols]
pmd_required_cols = ["PRUID", "CSDUID", "DBUID", "prox_idx_emp", "prox_idx_pharma",
                     "prox_idx_childcare", "prox_idx_health", "prox_idx_grocery",
                     "prox_idx_educpri", "prox_idx_educsec", "prox_idx_lib", "prox_idx_parks",
                     "prox_idx_transit", "amenity_dense", "transit_na"]
pmd_df = pmd_df[pmd_required_cols]

# Update column type to allow attribute match and join
db_gdf["DBUID"] = db_gdf["DBUID"].apply(int)

# Join PMD data with DB data
print("Joining PMD data with DB boundaries ...")
db_gdf = db_gdf.merge(pmd_df, on="DBUID", how="left")

# Simplify geometries with a tolerance of 10 m
print("Simplify geometries ...")
db_gdf['geometry'] = db_gdf['geometry'].simplify(10).buffer(0)

# Ensure geometries are valid
print("Ensuring geometries are valid ...")
db_gdf['geometry'] = db_gdf['geometry'].make_valid()

# Reproject Data to EPSG:4326
print("Reprojecting data to EPSG:4326 ...")
db_gdf = db_gdf.to_crs(4326)

# Split pmd data into two parts
pmd_2021_pt1 = db_gdf[db_gdf["PRUID"].isin([10, 11, 12, 13, 24, 35, 46, 59])]
pmd_2021_pt2 = db_gdf[db_gdf["PRUID"].isin([47, 48, 60, 61, 62])]

# Drop PRMUID column from dataframes
pmd_2021_pt1 = pmd_2021_pt1.drop(columns=["PRUID"])
pmd_2021_pt2 = pmd_2021_pt2.drop(columns=["PRUID"])

# Export preprocessed geodataframe
print("Exporting data ...")
pmd_2021_pt1.to_file("./output/pmd-2021-pt1.gpkg")
pmd_2021_pt2.to_file("./output/pmd-2021-pt2.gpkg")
