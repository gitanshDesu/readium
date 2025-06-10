import { Tag } from "@readium/database/tag.model";
import { UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { CustomError } from "@readium/utils/customError";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

//Create a Tag
export const createTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { name } = req.body;
    const existingTag = await Tag.findOne({
      name,
    });
    if (existingTag) {
      return res
        .status(400)
        .json(new CustomError(400, "Tag with this name already exist!"));
    }
    const newTag = await Tag.create({
      name,
      createdBy: req.user?._id,
    }).then((newTag) =>
      newTag.populate("createdBy", "username firstName lastName avatar")
    );
    return res
      .status(200)
      .json(new CustomApiResponse(200, newTag, "Tag Created Successfully!"));
  }
);

//Get All Tags (based on category, query, filter)
export const getAllTags = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { query, page = 1, limit = 10 } = req.query;
    //TODO: Add input Validation on req.query

    const pipeline = [
      {
        $match: {
          ...(query
            ? {
                name: { $regex: query, $options: "1" },
              }
            : {}),
        },
      },
      {
        $project: {
          name: 1,
        },
      },
    ];
    const myCustomLabels = {
      totalDocs: "AllTags",
      docs: "tags",
    };
    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      customLabels: myCustomLabels,
    };
    const paginateTags = await Tag.aggregatePaginate(pipeline, options);
    console.log("paginate Tags Array:\n", paginateTags);
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          paginateTags,
          "All Tags Fetched Successfully!"
        )
      );
  }
);

//Edit a tag (only owner of a tag can edit their tag(s))
export const editTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { tagId } = req.params;
    if (!isValidObjectId(tagId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Tag Id!"));
    }

    const { name } = req.body;
    //TODO: Add input Validation

    const existingTag = await Tag.findOne({
      $and: [
        {
          _id: tagId,
        },
        {
          createdBy: req.user?._id,
        },
      ],
    }).select("-createdBy");

    if (!existingTag) {
      return res.status(404).json(new CustomError(404, "Tag Doesn't Exist!"));
    }
    existingTag.name = name;
    await existingTag.save();
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, existingTag, "Tag Updated Successfully!")
      );
  }
);

//Delete a tag (only owner of a tag can delete their tag(s))
export const deleteTag = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const { tagId } = req.params;
    if (!isValidObjectId(tagId)) {
      return res.status(400).json(new CustomError(400, "Send Valid Tag Id!"));
    }
    const existingTag = await Tag.findOne({
      $and: [
        {
          _id: tagId,
        },
        {
          createdBy: req.user?._id,
        },
      ],
    }).select("-createdBy");
    if (!existingTag) {
      return res.status(404).json(new CustomError(404, "Tag Doesn't Exist!"));
    }
    await Tag.findByIdAndDelete(existingTag._id);
    return res
      .status(200)
      .json(
        new CustomApiResponse(200, existingTag, "Tag Deleted Successfully!")
      );
  }
);
