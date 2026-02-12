import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-[4vw] py-[3vh] flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#2BFFF1] flex items-center justify-center">
          <span className="text-[#05060B] font-bold text-lg">K</span>
        </div>
        <span className="text-[#F4F6FA] font-semibold text-xl tracking-tight">Kaleo</span>
      </div>

      {/* Nav Links - Hidden on mobile */}
      <div className="hidden md:flex items-center gap-8">
        <a 
          href="#buy" 
          className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium"
        >
          Buy
        </a>
        <a 
          href="#staking" 
          className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium"
        >
          Staking
        </a>
        <a 
          href="#docs" 
          className="text-[#A7B0B7] hover:text-[#2BFFF1] transition-colors text-sm font-medium"
        >
          Docs
        </a>
      </div>

      {/* Connect Wallet Button */}
      <ConnectButton 
        label="Connect Wallet"
        showBalance={false}
        chainStatus="none"
        accountStatus="address"
      />
    </nav>
  );
}
