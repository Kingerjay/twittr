import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Rightbar from "./Rightbar";

export const Layout = () => {
  return (
    <div className="flex h-screen max-w-full overflow-hidden 2xl:px-10">
      {/* Sidebar - hidden on small screens */}
      <div className="hidden sm:block sm:w-[300px] lg:w-[25%] xl:w-[300px] 2xl:w-[350px] xl:pl-10 overflow-y-auto scrollbar-hide">
        <Sidebar />
      </div>

      {/* Main Feed / Outlet */}
      <div className=" w-full sm:w-full lg:w-[50%] xl:w-[55%] 2xl:w-[800px] border-x border-[rgb(84,90,106)] overflow-y-auto scrollbar-hide">
        <Outlet />
      </div>

      {/* Rightbar - hidden on small and medium screens */}
      <div className="hidden lg:block sm:w-[80px] lg:w-[25%] xl:w-[300px] 2xl:w-[350px] px-5 overflow-y-auto scrollbar-hide">
        <Rightbar />
      </div>
    </div>
  );
};
