import pymongo
import os
import random
from dotenv import load_dotenv
from pdfText import pdfExtractor


def Random_answer():
    m = {
        1: "A",
        2: "B",
        3: "C",
        4: "D"
    }
    return m[random.choice([1, 2, 3, 4])]

load_dotenv()

client = pymongo.MongoClient('mongodb+srv://' + os.getenv('MONGOID') + 'hosa-demo.u9vtlvt.mongodb.net/')
db = client['HOSA']
collection = db[('mtquestions'.lower())]

pdfReader = pdfExtractor("./questions/MT.pdf")

print("starting ...")

for i in range(100):
    print(i+1)
    Question = {

        "Question": pdfReader.questions[i].replace("\n", " "),
        "OptionOne": pdfReader.optionOnes[i].replace("\n", " "),
        "OptionTwo": pdfReader.optionTwos[i].replace("\n", " "),
        "OptionThree": pdfReader.optionThrees[i].replace("\n", " "),
        "OptionFour": pdfReader.optionFours[i].replace("\n", " "),
        "Answer": Random_answer()
    }
    query = {"Question": pdfReader.questions[i]}
    result = collection.find_one(query)
    if not result:
        collection.insert_one(Question)
print("done")
