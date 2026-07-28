import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for JSON body parsing up to 20MB for images
  app.use(express.json({ limit: "20mb" }));

  // API Health Endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // API route for scanning invoice image using Gemini AI
  app.post("/api/scan-invoice", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "GEMINI_API_KEY is missing or unconfigured in runtime environment.",
        });
      }

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "File data is required for scanning." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");

      const prompt = `You are an expert financial invoice OCR and calculator assistant.
Analyze the attached supplier invoice image or PDF document accurately.
Extract and calculate all necessary invoice details:
1. Supplier / Vendor Name
2. Invoice Number
3. Invoice Date in YYYY-MM-DD format
4. Payment Term (Select best match: NET_7, NET_15, NET_30, NET_60, NET_90, COD, or CUSTOM)
5. Custom Days (if payment term is custom, the number of net days)
6. Grand Total Amount (the final total calculated payable amount)
7. Subtotal, Tax Amount, and Shipping/Handling fees if visible
8. Category (Select best match: Raw Materials, Equipment, Packaging, Logistics, Utilities, Services, Marketing, Office Supplies, or Other)
9. Purchase Order (PO) Number if visible
10. Line items breakdown (description, quantity, unit price, total amount)
11. Summary Notes highlighting any relevant calculation details or line items summary.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "application/pdf",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              supplierName: { type: Type.STRING },
              invoiceNumber: { type: Type.STRING },
              invoiceDate: { type: Type.STRING },
              paymentTerm: {
                type: Type.STRING,
                description: "NET_7 | NET_15 | NET_30 | NET_60 | NET_90 | COD | CUSTOM",
              },
              customDays: { type: Type.NUMBER },
              amount: { type: Type.NUMBER, description: "Final total amount" },
              subtotal: { type: Type.NUMBER },
              tax: { type: Type.NUMBER },
              shipping: { type: Type.NUMBER },
              category: {
                type: Type.STRING,
                description: "Raw Materials | Equipment | Packaging | Logistics | Utilities | Services | Marketing | Office Supplies | Other",
              },
              poNumber: { type: Type.STRING },
              summaryNotes: { type: Type.STRING },
              lineItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    total: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ["supplierName", "amount", "invoiceDate"],
          },
        },
      });

      const extractedText = response.text || "{}";
      const parsedData = JSON.parse(extractedText);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Invoice scan error:", err);
      return res.status(500).json({
        error: err.message || "Failed to analyze and calculate invoice from image.",
      });
    }
  });

  // Vite middleware for development, static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
