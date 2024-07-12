import { Request, Response } from "express";
import { db } from "../firebase.config";
import { generateImageFromProjectData } from "./generateImageFromProjectData";
import { Project } from "../../types";
const preview_project = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data=await db.collection('projects').doc(id).get()
if (!data.exists) {
    res.status(404).send('Project not found');
    return;
  }

  const project = data.data() as Project; // Retrieve project data
  const imageDataUrl =await generateImageFromProjectData(project); // Generate image URL
// console.log({imageDataUrl})
  res.status(200).json({ data: imageDataUrl });
  } catch (error) {
    res.status(500).send({message:error})
  }

};

export { preview_project };
