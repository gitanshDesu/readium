import { Blog } from "@readium/database/blog.model";
import { Tag, TagDocumentType } from "@readium/database/tag.model";
import { User, UserDocumentType } from "@readium/database/user.model";
import { CustomApiResponse } from "@readium/utils/customApiResponse";
import { tryCatchWrapper } from "@readium/utils/tryCatchWrapper";
import { Request, Response } from "express";

interface CustomRequest extends Request {
  user?: NonNullable<UserDocumentType>;
}

const getArrayOfTagIds = async (filter: string[]) => {
  try {
    const allTagDocs = await Promise.all(
      (filter as string[]).map((tagName) => Tag.findOne({ name: tagName }))
    );

    const allTagsId = allTagDocs.map((tag: TagDocumentType) => tag?._id);
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
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortType = 1,
      filter = [], //user can select multiple tags
    } = req.query;
    //TODO: Add input validation for req.query using zod

    //create array of Tag ids using "filter" array.
    const allTagsId = await getArrayOfTagIds(filter as string[]);

    const pipline = [
      {
        $match: {
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
                              { username: { $regex: query, $options: "i" } },
                              { firstName: { $regex: query, $options: "i" } },
                              { lastName: { $regex: query, $options: "i" } },
                            ],
                          }),
                        },
                      },
                    ],
                  },
                ],
              }
            : {}),
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
                email: 1,
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
      limit: parseInt(page as string),
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
