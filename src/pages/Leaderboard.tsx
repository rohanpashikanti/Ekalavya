import React from 'react';
import Layout from '../components/layout/Layout';

const AUTHOR_IMAGE = "https://res.cloudinary.com/dcoijn5mh/image/upload/v1748765182/WhatsApp_Image_2025-06-01_at_13.35.23_1_ozhzsu.jpg";
const IMAGE_2 = "https://res.cloudinary.com/dcoijn5mh/image/upload/v1748765182/WhatsApp_Image_2025-06-01_at_13.35.23_e0okjm.jpg";
const IMAGE_3 = "https://res.cloudinary.com/dcoijn5mh/image/upload/v1748765182/WhatsApp_Image_2025-06-01_at_13.35.24_wmphs2.jpg";

const AuthorPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[80vh] w-full bg-white">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center">
          {/* Left: Text Content */}
          <div className="flex flex-col justify-center items-center h-full text-center">
            <div className="mb-2 w-full">
              <span className="block text-[#A0A4A8] text-base font-medium tracking-wide mb-4 border-l-4 border-[#E1DDFC] pl-4 mx-auto text-left w-fit">Founder Of Ekalavya</span>
              <h1 className="text-5xl md:text-6xl font-bold text-[#1A1A1A] leading-tight mb-2">
                Rohan Pashikanti
              </h1>
              <div className="text-2xl text-[#5C5C5C] font-normal mb-6">Full Stack Developer</div>
              <p className="text-[#A0A4A8] text-lg mb-10 max-w-xl mx-auto">
                A curious mind at the crossroads of technology and introspection, I blend my Computer Science background with a reflective approach to create purposeful digital experiences. From AI tools to ideas on growth and resilience, I aim to connect logic with emotion and build with meaning.
              </p>
              <div className="flex gap-4 mt-2 justify-center">
                <a href="https://www.linkedin.com/in/rohanpashikanti/" target="_blank" className="px-8 py-4 rounded-lg bg-[#1A1A1A] text-white font-semibold shadow hover:bg-[#333] transition text-lg">Connect with me</a>
                <a href="https://rohanpashikanti.github.io/portfolio/" target="_blank" className="px-8 py-4 rounded-lg border border-[#1A1A1A] text-[#1A1A1A] font-semibold hover:bg-[#F6F1EC] transition text-lg  bg-transparent">Check my works</a>
              </div>
            </div>
          </div>
          {/* Right: Images Grid */}
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="grid grid-cols-2 grid-rows-2 gap-4 w-full max-w-xs md:max-w-sm">
              <img src={IMAGE_2} alt="Author 2" className="rounded-xl row-span-2 object-cover w-full h-full min-h-[320px] max-h-[420px]" />
              <img src={AUTHOR_IMAGE} alt="Author" className="rounded-xl object-cover w-full h-full min-h-[150px] max-h-[200px]" />
              <img src={IMAGE_3} alt="Books" className="rounded-xl object-cover w-full h-full min-h-[150px] max-h-[200px]" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuthorPage; 
