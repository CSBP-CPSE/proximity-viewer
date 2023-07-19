import pandas as pd
import json
import math


def Truncate(number, digits) -> float:
    stepper = 10.0 ** digits

    return math.trunc(stepper * number) / stepper


def GetDropFields(df, keep):
    drop = list(df.columns)

    for f in keep:
        drop.remove(f["id"])

    return drop


def ReadJSON(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def DumpJSON(output, data):
    with open(output, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)


def DumpCSV(output, data):
    df = pd.DataFrame(data)

    df.to_csv(output, index=False)

