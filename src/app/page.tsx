import Image from "next/image";
import Astronaut from "./astro";

export default function SpaceShip() {
  return (

    <div className="bg-[#04052E] min-h-screen relative">
      <div className="absolute left-0 top-0 transform -translate-y-1/2 min-w-screen h-50 bg-[#1E1E1E]">
      
      </div>
      <div className="absolute left-20 top-14/28 transform -translate-y-1/2 w-120 h-180">
        <Image
          src={"/Group 3.png"}
          alt="Spaceship"
          width={400}
          height={590}
          className="w-full h-full"
        />
        <div className="absolute w-110 h-70 left-5 top-55 bg-gray-50 rounded-lg overflow-hidden">
          <Astronaut />
        </div>
      </div>
      <div className="absolute left-160 top-5/27 transform -translate-y-3/8 w-280 h-15 bg-gray-100 border border-gray-400 rounded-t-lg overflow-hidden">
      </div>
      <div className="flex items-center justify-center absolute left-170 top-5/27 transform -translate-y-3/8 w-80 h-15 bg-gray-200 border border-gray-400 rounded-lg overflow-hidden text-[20pt] font-bold">
        Calorie Tracker
      </div>
      <div className="absolute left-160 top-13/28 transform -translate-y-3/8 w-280 h-160 border border-gray-400 rounded-b-lg overflow-hidden">
         {/* put calorie counter stuff in here */}
      </div>
    </div>

  );
}