"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { HomeDesktop } from "@/components/HomeDesktop";
import { HomeMobile } from "@/components/HomeMobile";

export default function Home() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <HomeMobile />;
  }
  
  return <HomeDesktop />;
}
