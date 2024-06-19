'use client'

import Header from "../ui/header";
import { Proposals } from "../ui/proposals";
import { Footer } from "../ui/footer";
import { useDaoMeta } from "../providers/dao-provider";
import { RealmMetaType } from "../hooks/useRealm";
import { GradientBackground } from "../ui/background";
import Transition from "../ui/transition";

function DaoUi() {
  const realmMeta = useDaoMeta() as RealmMetaType
  return (
      <main className="flex min-h-screen flex-col items-center px-4 md:px-24 py-8"
        style={{
          backgroundImage: realmMeta.mainBackgroundImg ?
            `url(${realmMeta.mainBackgroundImg}), linear-gradient(to bottom, ${realmMeta.gradientOne}, ${realmMeta.gradientTwo})` :
            `linear-gradient(to bottom, ${realmMeta.gradientOne}, ${realmMeta.gradientTwo})`,
          backgroundSize: "1440px"
        }}
      >
        <GradientBackground />
        <Header />
        <Proposals /> 
        <Transition />
        <Footer />
      </main>
  );
}

export default DaoUi