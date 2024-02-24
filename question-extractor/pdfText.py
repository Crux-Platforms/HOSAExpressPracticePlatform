import PyPDF2
import re

class pdfExtractor:

  def __init__(self, path):
    self.pdf_file = open(path, 'rb')
    self.pdf_reader = PyPDF2.PdfReader(self.pdf_file)
    self.num_pages = len(self.pdf_reader.pages)
    self.keyPageIndex = 14
    self.questions = self.getQuestions()
    self.optionOnes = self.getOptionOne()
    self.optionTwos = self.getOptionTwo()
    self.optionThrees = self.getOptionThree()
    self.optionFours = self.getOptionFour()
    # self.answers = self.getCorrectOptions()
    self.pdf_file.close()

  def getQuestions(self):
    questions = []
    question = ""
    start_of_question = False
    for page_number in range(0,self.keyPageIndex + 1):
      page = self.pdf_reader.pages[page_number]
      text = page.extract_text()
      for i in range(len(text)):
        character = text[i]
        if(character.isdigit() and i < (len(text)-1) and text[i+1] == "."):
          start_of_question = True
        if(character == "A" and i < (len(text)-1) and text[i+1] == "."):
          questions.append(question[2:])
          question = ""
          start_of_question = False
        if(start_of_question == True):
          question = question + character

    return questions

  def getOptionOne(self):
    optionOnes = []
    optionOne = ""
    start_of_Option_One = False
    for page_number in range(self.keyPageIndex):
        page = self.pdf_reader.pages[page_number]
        text = page.extract_text()
        for i in range(len(text)):
          character = text[i]
          if(character == "A" and i < (len(text)-1) and text[i+1] == "."):
            start_of_Option_One = True
          if(start_of_Option_One):
            if(character == "\n" and re.search('[a-zA-Z]', optionOne[2:])
                                               and( (text[i+1] == "B" and text[i+2] == "." )or (text[i+1: i+5] =="MEDI"))):
              if(optionOne[2:] != '  '):
                optionOnes.append(optionOne[2:])
              optionOne = ""
              start_of_Option_One = False
          if(start_of_Option_One):
            optionOne = optionOne + character
            #print(optionOnes)
    return optionOnes

  def getOptionTwo(self):
    optionTwos = []
    optionTwo = ""
    start_of_Option_Two = False
    for page_number in range(self.keyPageIndex):
        page = self.pdf_reader.pages[page_number]
        text = page.extract_text()
        for i in range(len(text)):
          character = text[i]
          if(character == "B" and i < (len(text)-1) and text[i+1] == "."):
            start_of_Option_Two = True
          if(start_of_Option_Two):
            if(character == "\n" and re.search('[a-zA-Z]', optionTwo[2:])
               and ((text[i+1] == "C") or (text[i+1: i+5] == "MEDI") )):
              if(optionTwo[2:] != '  '):
                optionTwos.append(optionTwo[2:])
              optionTwo = ""
              start_of_Option_Two = False
          if(start_of_Option_Two == True):
            optionTwo = optionTwo + character
            #print(optionOnes)
    return optionTwos

  def getOptionThree(self):
    optionThrees = []
    optionThree = ""
    start_of_Option_Three = False
    for page_number in range(self.keyPageIndex):
        page = self.pdf_reader.pages[page_number]
        text = page.extract_text()
        for i in range(len(text)):
          character = text[i]
          if(len(optionThrees) == 46):
            optionThrees.append(" Epithelium ")
          else:
            if(character == "C" and i < (len(text)-1) and text[i+1] == "."):
              start_of_Option_Three = True
            if(start_of_Option_Three):
              if(character == "\n" and re.search('[a-zA-Z]', optionThree[2:])
                 and( (text[i+1] == "D" and text[i+2] == ".") or (text[i+1: i+5] == "MEDI"))):
                if(optionThree[2:] != '  '):
                  optionThrees.append(optionThree[2:])
                optionThree = ""
                start_of_Option_Three= False
            if(start_of_Option_Three == True):
              optionThree = optionThree + character
              #print(optionOnes)
    return optionThrees

  def getOptionFour(self):
    optionFours = []
    optionFour = ""
    start_of_Option_Four = False
    for page_number in range(self.keyPageIndex):
        page = self.pdf_reader.pages[page_number]
        text = page.extract_text()
        for i in range(len(text)):
          character = text[i]
          if(character == "D" and i < (len(text)-1) and text[i+1] == "."):
            start_of_Option_Four = True
          if(start_of_Option_Four):
            if(character == "\n" and re.search('[a-zA-Z]', optionFour[2:])
               and (
                 (text[i+1].isdigit() and text[i+2] == ".")
                 or (text[i+1].isdigit() and text[i+2].isdigit() and text[i+3] == "." )
                 or (text[i+1].isdigit() and text[i+2].isdigit() and text[i+3].isdigit() and text[i+4] == "." )
                 or text[i+1: i+5] =="MEDI"
                 )):
              # print(optionFour[2:])
              if(optionFour[2:] != '  '):
                optionFours.append(optionFour[2:])
              optionFour = ""
              start_of_Option_Four = False
          if(start_of_Option_Four == True):
            optionFour = optionFour + character
            #print(optionOnes)
    #print(optionFours)
    return optionFours

  def getCorrectOptions(self):
    correctOptions = []
    option = ""
    startOfAnswer = False
    prevNumber = 0
    for page_number in range(self.keyPageIndex,self.num_pages):
        page = self.pdf_reader.pages[page_number]
        text = page.extract_text()
        for i in range(len(text)):
          character = text[i];
          if(character.isdigit() and i < (len(text)-1) and text[i+1]== "."):
            startOfAnswer = True
          if(startOfAnswer == True and (character == "A" or character =="B" or character == "C" or character == "D") and ((text[i-2] + text[i-1]) == ". ") and text[i-3].isdigit()):
              if(int(text[i-4] + text[i-3])-1 == prevNumber or (int(text[i-4] + text[i-3]) == 00 and prevNumber == 99)):
                correctOptions.append((character))
                prevNumber = int(text[i-4] + text[i-3])
                startOfAnswer = False
    return correctOptions
