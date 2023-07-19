import geopandas as gpd
import util as u
from pathlib import Path, PurePath


def CreateBookmarks(CMA, oFile):
    cPath = PurePath("./output", "./config")

    Path(cPath).mkdir(parents=True, exist_ok=True)

    df = gpd.read_file(CMA)

    data = {"id": "bookmarks", "items": []}

    for index, row in df.iterrows():
        bb = row.geometry.bounds
        line = {"label": row.CMANAME,
                "extent": [[u.Truncate(bb[0], 6), u.Truncate(bb[1], 6)], [u.Truncate(bb[2], 6), u.Truncate(bb[3], 6)]]}
        data["items"].append(line)

    u.DumpJSON(cPath.joinpath(oFile), data)


CreateBookmarks('./source/CMA/lcma000b21a_e.shp', 'config.bookmarks.json')
