import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import PizZipUtils from "pizzip/utils/index.js";
import { saveAs } from "file-saver";

type TemplateData = Record<string, unknown>;

const loadFile = (
    url: string,
    callback: (error: Error | null, content?: string) => void,
): void => {
    PizZipUtils.getBinaryContent(url, callback);
};

export const generateDocument = (
    templateUrl: string,
    fileName: string,
    data: TemplateData,
): void => {
    loadFile(templateUrl, (error, content) => {
        if (error) {
            throw error;
        }

        if (!content) {
            throw new Error("Template tidak ditemukan atau kosong.");
        }

        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            linebreaks: true,
            paragraphLoop: true,
        });

        doc.render(data);

        const blob = doc.getZip().generate({
            type: "blob",
            mimeType:
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        saveAs(blob, fileName);
    });
};