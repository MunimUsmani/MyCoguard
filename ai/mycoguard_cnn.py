import sys
import json

def analyze(img):

    result = {

        "status":"healthy",

        "efficiency":0.82,

        "risk":"low"

    }

    return result


if __name__=="__main__":

    img_path = sys.argv[1]

    output = analyze(img_path)

    print(json.dumps(output))