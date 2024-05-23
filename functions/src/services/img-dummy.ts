// const fs = require("fs");
// const { PDFDocument, rgb } = require("pdf-lib");

// async function fillPDFForm(inputPDFPath, outputPDFPath) {
//     try {
//         // Load the PDF document
//         const pdfBytes = fs.readFileSync(inputPDFPath);
//         const pdfDoc = await PDFDocument.load(pdfBytes);

//         // Get the form
//         const form = pdfDoc.getForm();
//         const fields = form.getFields();
//         // const emblemUrl = 'https://pdf-lib.js.org/assets/mario_emblem.png'
//         // const emblemImageBytes = await fetch(emblemUrl).then(res => res.arrayBuffer())
//         const emblemImageBytes = fs.readFileSync("download.png");
//         const emblemImage = await pdfDoc.embedPng(emblemImageBytes);

//         const hello = form.getTextField("PatientName");
//         const signatureField = form.getField("Signature");

//         hello.setText("Mario");

//         // Get the widget annotations for the signature field
//         const widgets = signatureField.acroField.getWidgets();
//         const rect = widgets[0].getRectangle();

//         // Remove the signature field from the form
//         form.removeField(signatureField);

//         // Draw the image at the location of the signature field
//         const pages = pdfDoc.getPages();
//         const firstPage = pages[0];

//         firstPage.drawImage(emblemImage, {
//             x: rect.x,
//             y: rect.y,
//             width: rect.width / 2,
//             height: rect.height * 1.5,
//         });

//         fields.forEach((field) => {
//             const fieldName = field.getName();
//             const fieldType = field.constructor.name;
//             // console.log(`Field Name: ${fieldName}, Type: ${fieldType}`);
//         });

//         // Apply updates to the PDF document
//         const updatedPdfBytes = await pdfDoc.save();

//         // Save the filled-out PDF
//         fs.writeFileSync(outputPDFPath, updatedPdfBytes);
//         console.log("PDF form filled and saved successfully!");
//     } catch (err) {
//         console.error("Error filling PDF form:", err);
//     }
// }

// // Call the function to fill the PDF form
// fillPDFForm("Legacy-Impax-IVR.pdf", "filled-out.pdf");
