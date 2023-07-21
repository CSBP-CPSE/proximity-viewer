import pandas as pd
import util as u
from pathlib import Path, PurePath

# Column field name variables
# Before running this script, update the variables with the strings matching
# the names in the dataset for dbuid column, index, lat, and long columns.
TABLECONFIG = "./source/PMD/pmd.json"
CSDUID = "CSDUID"
INDEX = "DBUID"
LAT = "lat"
LONG = "lon"
TRUC_COLS = ['prox_idx_emp', 'prox_idx_pharma', 'prox_idx_childcare', 'prox_idx_health', 'prox_idx_grocery', 'prox_idx_educpri', 'prox_idx_educsec', 'prox_idx_lib', 'prox_idx_parks', 'prox_idx_transit', 'amenity_dense']


def BuildDf(iFile):
    """
    Build a Data Frame with the provided dataset
    :param iFile {string} - Path to input dataset
    :return pandas dataframe
    """
    df = pd.read_csv(iFile, index_col=False, encoding='utf-8', dtype={CSDUID: str})

    # Exclude null lat/long series from data frame
    df = df[~df[LAT].isnull()][~df[LONG].isnull()]

    return df


def UpdateDFColOrder(df, config_cols):
    """
    Update the column order of the data frame to match the order of the columns listed in the config
    :param df: Pandas dataframe
    :param config_cols: table config file property containing a list of fields
    :return: Updated data frame
    """

    df_columns_updated = []
    df_columns = df.columns.to_list()

    for config_col in config_cols:
        config_col_id = config_col['id']
        if config_col_id in df_columns:
            # Append config column
            df_columns_updated.append(config_col_id)

            # Remove matching column from df column list
            df_columns.remove(config_col_id)

    # Add remaining df columns to updated columns list
    df_columns_updated.extend(df_columns)

    # Update df column order
    df = df[df_columns_updated]

    return df


def CreateTableConfig(path, config):
    """
    Create the table config file and stores it in ./output/config/tables directory
    :param path {string} -
    :param config {dictionary} - table configuration used to generate tables
    """
    jPath = PurePath("./data", path)
    cPath = PurePath("./output", "./config", "./tables")

    Path(cPath).mkdir(parents=True, exist_ok=True)

    del config["source"]

    config["path"] = str(jPath)

    file = "config.table.json"

    u.DumpJSON(cPath.joinpath(file), config)


def CreateTableFiles(df, path, drop, config):
    """
    Create table files from data, and also the associated table config file
    :param df {dataframe} - dataframe containing input data
    :param path {string} - The ID of data being processed which is used to specify the output of the table files
    :param drop {list} - a list of drop columns which were not used included in the output
    :param config {dictionary} - configuration of how to generate the table output files
    """
    # Create the string for the path for storing output data.
    tPath = PurePath("./output", "./data", path)

    # Create the output data directory
    Path(tPath).mkdir(parents=True, exist_ok=True)

    # Split dataframe content by CSD Unique ID
    csduid_groups = df.groupby(CSDUID)

    # Loops through each csduid (x) in the groups and copies the associated csduid df (y) into the split list
    split = [pd.DataFrame(y) for x, y in csduid_groups]

    config["summary"] = {}

    # Loop through split dataframe content and output it's content as csv files
    # Note: CSV files represent features in specific CSD's and are grouped by 50 records
    for s in split:
        DB = str(s[CSDUID].iloc[0])
        s = s.sort_values(INDEX, ascending=True).drop(columns=drop)

        # Break-up split CSD content into groups of 50 for each page of the table view
        # Note: This commonly occurs for higher density urban areas.
        split_50 = [s[i:i + 49] for i in range(0, len(s), 50)]

        if len(s) > 0:
            config["summary"][DB] = len(split_50)

        for index, s_50 in enumerate(split_50):
            # Update output file name based on index of the 50 record group
            oFile = DB + '_' + str(index + 1) + '.json'

            # Output CSV file with json extension because NDM server don't allow CSV files for some reason.
            u.DumpCSV(tPath.joinpath(oFile), s_50)

    # Create a table config file
    CreateTableConfig(path, config)


# Base table configuration, this needs to be changed by dataset
config = u.ReadJSON(TABLECONFIG)

# Create a dataframe based on data source URL provided in the config file
df = BuildDf(config["source"])

# Ensure CSDUID column is of type integer
csduid_df = df[CSDUID]
csduid_df = pd.to_numeric(csduid_df, downcast='integer')
df[CSDUID] = csduid_df

# Truncate proximity column values to 4 decimal places
# Column value are a mix of floating point numbers and text
for col_name in TRUC_COLS:
    print(f"Truncating values in column {col_name} ... ")
    col = df[col_name]
    for i in range(len(col)):
        try:
            # Make sure cell value is a float
            floatValue = float(col[i])
            # Truncate float to 4 decimal places
            floatValue = float(f'{floatValue:.4f}')
            # Cast value back to strings
            df.loc[i, col_name] = str(floatValue)
        except:
            # Can't convert cell value to float
            pass


# Update column order of df to match fields order in config
df = UpdateDFColOrder(df, config["fields"])

# Create a list of dropped fields not listed in the table config file
drop = u.GetDropFields(df, config["fields"])

# Create table files for data based on boundary locations
CreateTableFiles(df, config["id"], drop, config)
