import { v4 as uuidv4 } from "uuid";
import { JsonBook, JsonChapter, JsonVolume } from "../lib/SfacgInterface";

const uuid = uuidv4();

function generateContainer() {
    return `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
}

function generateChapterHTML(ctitle: string, content: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${ctitle}</title>
    <link rel="stylesheet" type="text/css" href="../Styles/main.css"/>
</head>
<body>
    <h2>${ctitle}</h2>
    ${content}
</body>
</html>`;
}

function generateVolumeHTML(vtitle: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${vtitle}</title>
    <link rel="stylesheet" type="text/css" href="../Styles/main.css"/>
</head>
<body>
    <h1>${vtitle}</h1>
</body>
</html>`;
}

function generateContentOpf(book: JsonBook) {
    let manifestItems = `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`;
    let spineItems = "";

    book.content.forEach((volume: JsonVolume, vIndex) => {
        manifestItems += `\n<item id="volume_${vIndex + 1}" href="Text/volume_${
            vIndex + 1
        }.html" media-type="application/xhtml+xml"/>`;
        spineItems += `\n<itemref idref="volume_${vIndex + 1}"/>`;
        volume.chapters.forEach((chapter: JsonChapter, cIndex: number) => {
            manifestItems += `\n<item id="chapter_${vIndex + 1}_${cIndex + 1}" href="Text/chapter_${
                vIndex + 1
            }_${cIndex + 1}.html" media-type="application/xhtml+xml"/>`;
            spineItems += `\n<itemref idref="chapter_${vIndex + 1}_${cIndex + 1}"/>`;
        });
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${book.title}</dc:title>
        <dc:creator>${book.author}</dc:creator>
        <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
        <dc:language>zh</dc:language>
        <meta name="cover" content="cover-image" />
    </metadata>
    <manifest>
        ${manifestItems}
    </manifest>
    <spine toc="ncx">
        ${spineItems}
    </spine>
</package>`;
}
