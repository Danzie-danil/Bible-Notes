const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('swahili-bible-edition.json', 'utf8'));

  const out = {
    translation: "Swahili",
    lang: "sw",
    books: data.BIBLEBOOK.map((b) => {
      const chaptersRaw = Array.isArray(b.CHAPTER) ? b.CHAPTER : [b.CHAPTER];
      return {
        nr: parseInt(b.book_number),
        name: b.book_name,
        chapters: chaptersRaw.map((c) => {
          const versesRaw = Array.isArray(c.VERSES) ? c.VERSES : [c.VERSES];
          return {
            chapter: parseInt(c.chapter_number),
            name: `${b.book_name} ${c.chapter_number}`,
            verses: versesRaw.map((v) => {
              return {
                chapter: parseInt(c.chapter_number),
                verse: parseInt(v.verse_number),
                name: `${b.book_name} ${c.chapter_number}:${v.verse_number}`,
                text: v.verse_text.trim()
              };
            })
          };
        })
      };
    })
  };

  fs.writeFileSync('bible_swahili.json', JSON.stringify(out));
  console.log('Transcoded bible_swahili.json successfully.');
} catch (e) {
  console.error(e);
}
