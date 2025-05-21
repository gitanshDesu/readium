import { User } from "@readium/database/user.model";
export const generateAccessAndRefreshToken = async (
  username: string
): Promise<{
  accessToken: string;
  refershToken: string;
}> => {
  const user = await User.findOne({ username });
  const accessToken = user?.generateAccessToken()!;
  const refershToken = user?.generateRefreshToken()!;
  return { accessToken, refershToken };
};
