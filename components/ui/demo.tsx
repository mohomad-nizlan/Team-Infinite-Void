"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ParticleSphere } from "@/components/ui/cosmos-3d-orbit-gallery"

export default function Home() {
  const pexelsImages = [
    "https://cdn.21st.dev/assets/mirror/63/63dd9755c755cf0633ea36c78a64d26ce861f83faf2950e45b6d0323063165cb.jpg",
    "https://cdn.21st.dev/assets/mirror/8f/8f2e7dffe0d66b0c75205b38287682aef6d2063425038ed0e4d7db9b6f263bc7.jpg",
    "https://cdn.21st.dev/assets/mirror/22/2231063bbc8df9b5f879d985c257f46d781684b340bc17ab82e836157c4e2a63.jpg",
    "https://cdn.21st.dev/assets/mirror/e6/e63c95b73a702ee4cdd684b5bcb8b314fdf365a1170dc103f272bdb17593b916.jpg",
    "https://cdn.21st.dev/assets/mirror/57/57e5fa1b3a6556c99c5b886760587d2ede7a81d418ec7452edd62909c188f380.jpg",
    "https://cdn.21st.dev/assets/mirror/c0/c0d7bd9dd8d7188c78921deefa43ed2d8ec43764e5cb26f6a76460f50693d902.jpg",
    "https://cdn.21st.dev/assets/mirror/82/825eacecce852a8c5ef1e6500af399824f6b3f90a1ff9725726534f1e3c15376.jpg",
    "https://cdn.21st.dev/assets/mirror/0f/0fc0ed0dae94aea0b89567ece95646b86d1d4811216dcddd5ef811532f48aa84.jpg",
    "https://cdn.21st.dev/assets/mirror/44/44d9e457e6ddbfbf9e28824082d21c56262079e7bbe1653d90dcc4aa3870ca95.jpg",
    "https://cdn.21st.dev/assets/mirror/a3/a3a2f5ef8b462460fd06629b004cebc66741b432f5a54688ad78bd205ceb88dc.jpg",
    "https://cdn.21st.dev/assets/mirror/85/85f9dcd8a3db2020ff08432bd3ba77e3c1a6105b5e9f7a6a3ba6f63c1cad420d.jpg",
    "https://cdn.21st.dev/assets/mirror/43/43a549178a56d34ddba4f6024f27c5ec0ed82b4d8132bd813de0d1edea175399.jpg",
    "https://cdn.21st.dev/assets/mirror/bf/bfa125b36137d6464bea9ada9bf7a9d7d3ed5a0d1fb5ef491a7e89f40e9d7688.jpg",
    "https://cdn.21st.dev/assets/mirror/6a/6a53ab92753c4facc64134d260460346b5323741017d7d2753e2a32e1e626e5e.jpg",
    "https://cdn.21st.dev/assets/mirror/69/699f4fa61d3312af842265920a6707628ba67eaea7ac00e2040edadb4505eac8.jpg",
    "https://cdn.21st.dev/assets/mirror/14/148264ce8b3e45ecffa2a2b76444622633e331d31b082b7be643321de592d9d1.jpg",
    "https://cdn.21st.dev/assets/mirror/60/6038d39fe65bc218b6a036a800f835753519a043fb0376002c989ba30a6f90dc.jpg",
    "https://cdn.21st.dev/assets/mirror/83/838c3fb6be73c52b9d8442d3a96015b2b2c275e6cd0ba5cc297fadbb8d2d7a17.jpg",
    "https://cdn.21st.dev/assets/mirror/34/340c464d061db93bf3b78145ad1894047524c4bd93cf5d485b73cb65fc3ea908.jpg",
    "https://cdn.21st.dev/assets/mirror/6c/6caf1639774c907db8059602e59b7bad37eb17974e1d9dd640553aee88c43af2.jpg",
    "https://cdn.21st.dev/assets/mirror/e9/e9893051287acf74ab64bd28a4dfa2bdf86b83192e1453e452d56ede2068ca57.jpg",
    "https://cdn.21st.dev/assets/mirror/29/2944be541f9877030efbb253e2925dbfc3171766809d1b506a31b34c82889126.jpg",
    "https://cdn.21st.dev/assets/mirror/60/607e443f43f933177bd1f3ddcd5592a226c74c04be21ba7a716c6e7fb4640a39.jpg",
    "https://cdn.21st.dev/assets/mirror/14/144b1358bfdfcbac71e1f90d5d4b41cf6e5a57d16e919af24e972d6895b47a4d.jpg",
  ]

  return (
    <div className="w-full h-screen bg-black relative">
      <div className="fixed top-20 left-0 right-0 z-10 p-6">
        <h1 className="max-w-[750px] mx-auto text-white text-center font-instrument-serif px-6 md:text-6xl text-4xl text-balance tracking-tight font-normal">
          The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.
        </h1>
      </div>

      <Canvas camera={{ position: [-10, 1.5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ParticleSphere images={pexelsImages} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}
