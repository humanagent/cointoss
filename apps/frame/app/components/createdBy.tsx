import type { UserInfo } from "../../lib/resolver";

export default function CreatedBy({
  userProfile,
  readableDate,
}: {
  userProfile: UserInfo;
  readableDate: string;
}) {
  return (
    <div
      tw="absolute bottom-[77px] left-[64px] h-[90px] w-full flex flex-row items-center space-x-8"
      style={{
        marginTop: "-50px",
      }}>
      {userProfile?.avatar ? (
        <img src={userProfile.avatar} tw="h-[72px] w-[72px] rounded-full" />
      ) : (
        <div tw="h-[72px] w-[72px] rounded-full bg-gray-200 flex" />
      )}
      <div tw="flex flex-col items-start ml-2">
        <p tw="text-[26px] flex flex-col">
          <span
            tw="font-bold ml-2"
            style={{
              fontFamily: "Overpass-Bold",
              fontWeight: 700,
            }}>
            Created by {userProfile?.preferredName}
          </span>
          <span
            tw="font-bold ml-2"
            style={{
              fontFamily: "Overpass-Regular",
              fontWeight: 400,
            }}>
            Ends {readableDate}
          </span>
        </p>
      </div>
    </div>
  );
}
