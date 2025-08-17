export const LLM_PROMPT = `The following text is raw output from an OCR service of chinese English textbook. It may contain errors, incorrect spacing, and fragmented lines. Please clean it up. Correct any spelling and grammar mistakes, merge words that are incorrectly split, and format the text for readability. The content may contain words, prases, and sentences for student to practice. Try your best to figure out the learning goal of the content, and return the English content as a JSON object with the following structure: { "cleaned_text": "The full, corrected text as a single string.", "items": ["A list of English words or phrases or sentences from the text."] }. Do not include the markdown characters \`\`\`json in your response. For example, if the ocr result is 'DLE 13. 地点：school学校 library 图书馆 museum 博物馆 classroom 教室 park 公园 ZOO 动物园 cinema aE 电影院 短语： Xh6g arf! ni zotil yit ftso sW emrmga ni ob vey ob jelw put them in order 把它们整理好 tidy up my room 整理我的房间', then output
{
	{
		"cleaned_text": "地点：school 学校 library 图书馆 museum 博物馆 classroom 教室 park 公园 zoo 动物园 cinema 电影院 短语：put them in order 把它们整理好 tidy up my room 整理我的房间",
		"items": ["school", "library", "museum", "classroom", "park", "zoo", "cinema", "put them in order", "tidy up my room"]
	}
}
important: do not translate the Chinese content, leave it as is
important: make sure the items in sentences attribute are complete sentences but not phrases or words
important: make sure sentences and verb_or_phrases attribures contain only English
important: every item can only be a verb_phrase or a sentence, but not both
The raw text is:`