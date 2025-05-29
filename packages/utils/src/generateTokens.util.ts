import { User } from "@readium/database/user.model";
export const generateAccessAndRefreshToken = async (
  username: string
): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const user = await User.findOne({ username });
  const accessToken = user?.generateAccessToken()!;
  const refreshToken = user?.generateRefreshToken()!;
  return { accessToken, refreshToken };
};
