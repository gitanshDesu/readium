import { Blog } from "@readium/database/blog.model";
import { Tag, TagDocumentType } from "@readium/database/tag.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";
import {
  getAllSuchBlogsInputSchema,
  GetAllSuchBlogsInputType,
} from "@readium/zod/getAllSuchBlogs";
import { CustomError } from "@readium/utils/customError";
import QueryString from "qs";
import mongoose from "mongoose";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}
function isStringifiedArray(str: string) {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed);
  } catch (e) {
    return false;
  }
}

const getArrayOfTagIds = async (filter: string | string[] | undefined) => {
  try {
    if (!filter) {
      return [];
    }
    if (!Array.isArray(filter) && typeof filter !== "string") {
      console.error("Expected array or string but got:", typeof filter, filter);
      throw new CustomError(
        400,
        "Filter must be an array of strings or strings"
      );
    }
    if (typeof filter === "string" && isStringifiedArray(filter)) {
      console.error("Expected array or string but not a stringyfied array");
      throw new CustomError(
        400,
        "Filter must be Array or a string and not stringyfied array!"
      );
    }
    if (
      typeof filter === "string" &&
      !isStringifiedArray(filter) &&
      !Array.isArray(filter)
    ) {
      const tagDoc = await Tag.findOne({ name: filter });
      const tagId = tagDoc?._id;
      if (!tagId) {
        throw new CustomError(400, "Tag doesn't exist!");
      }
      return [tagId];
    }
    const allTagDocs = await Promise.all(
      (filter as string[]).map((tagName) => Tag.findOne({ name: tagName }))
    );

    const allTagsId = allTagDocs
      .filter((tag) => tag !== null)
      .map((tag: TagDocumentType) => tag?._id);
    return allTagsId;
  } catch (error) {
    //TODO: Add Custom Error
    console.log("Error Occurred while extracting Tag Documents: \n ", error);
  }
};

//contain all the controllers related to search - for blogs, users.
//This controller will get all blogs based on search query(can put title, content, username, firstName, lastName), filters(tags arrays), sortBy and sortType, user will also sent page and limit (to paginate data).
export const getAllSuchBlogs = tryCatchWrapper<CustomRequest>(
  async (req: CustomRequest, res: Response) => {
    const {
      query = "", //get all blogs based on this query
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortType = "1",
      filter = [], //user can select multiple tags
    }: GetAllSuchBlogsInputType | QueryString.ParsedQs = req.query;

    const validation = getAllSuchBlogsInputSchema.safeParse({
      query,
      page,
      limit,
      sortBy,
      sortType,
      filter,
    });

    if (!validation.success) {
      return res
        .status(400)
        .json(new CustomError(400, validation.error.message));
    }

    //create array of Tag ids using "filter" array.
    const allTagsId = await getArrayOfTagIds(
      filter as string[] | string | undefined
    );

    const pipline = [
      {
        $match: {
          // using $or we can get all the blogs which are published and either have matching query(query matches either with blog's title,content or blog's author's username, firstName or lastName) && matching filter(matches all tags a blog has) OR have matching query or filter
          $or: [
            {
              ...(query
                ? {
                    $and: [
                      { isPublished: true }, //blogs should be published
                      {
                        $or: [
                          { title: { $regex: query, $options: "i" } },
                          { content: { $regex: query, $options: "i" } },
                          {
                            //query: could contain username, firstName + lastName
                            author: {
                              $in: await User.find({
                                $or: [
                                  {
                                    username: { $regex: query, $options: "i" },
                                  },
                                  {
                                    firstName: { $regex: query, $options: "i" },
                                  },
                                  {
                                    lastName: { $regex: query, $options: "i" },
                                  },
                                ],
                              }),
                            },
                          },
                        ],
                      },
                    ],
                  }
                : {}),
            },
            {
              ...(filter
                ? {
                    $and: [
                      { isPublished: true },
                      {
                        "blogAssets.tags": {
                          $in: allTagsId,
                        },
                      },
                    ],
                  }
                : {}),
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
          pipeline: [
            {
              $project: {
                username: 1,
                firstName: 1,
                lastName: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "tags",
          as: "populatedTags",
          localField: "blogAssets.tags",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          author: {
            $arrayElemAt: ["$author", 0],
          },
          "blogAssets.tags": "$populatedTags",
        },
      },
      {
        $project: {
          populatedTags: 0,
        },
      },
    ];

    //Adding sorting logic:
    const myCustomLabels = {
      totalDocs: "totalBlogs",
      docs: "blogs",
    };
    //TODO: Create logic of sortBy: month, year, most likes, views? (we might need to add view field in blog model[and think about logic of how will we count a view on a blog])
    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: {
        [sortBy as string]: sortType,
      },
      customLabels: myCustomLabels,
    };
    const paginateBlogs = await Blog.aggregatePaginate(pipline, options);
    console.log("paginateBlogs:\n", paginateBlogs);
    return res
      .status(200)
      .json(
        new CustomApiResponse(
          200,
          paginateBlogs,
          "All Blogs Fetched Successfully!"
        )
      );
  }
);
