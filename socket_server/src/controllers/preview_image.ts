import { Request, Response } from "express";
import { db } from "../firebase.config";
import { createExportableCanvas } from "./createExportableCanvas";
import { Project } from "../../types";
const preview_project = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await db.collection("projects").doc(id).get();
    if (!data.exists) {
      res.status(404).send("Project not found");
      return;
    }
    res.writeHead(200, { "Content-Type": "image/png" });

    const project = data.data() as Project; // Retrieve project data
    const staticCanvas = await createExportableCanvas(project); // Generate image URL
    // console.log({imageDataUrl})
    var stream = staticCanvas.createPNGStream();
    stream.on("data", function (chunk) {
      // console.log(chunk)
      res.write(chunk);
    });
    stream.on("end", function () {
      res.end();
    });
    // res.status(200).json({ data: imageDataUrl });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

export { preview_project };
