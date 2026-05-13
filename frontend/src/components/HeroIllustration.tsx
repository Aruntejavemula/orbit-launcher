import { memo } from "react";

interface Props {
  hour?: number;
}

export default memo(function HeroIllustration({ hour: hourProp }: Props) {
  const hour = hourProp ?? new Date().getHours();
  const isSunrise = hour >= 5 && hour < 9;
  const isDay = hour >= 9 && hour < 16;
  const isNight = hour >= 21 || hour < 5;

  const skyColors = isNight
    ? ["#1A2332", "#2B3A4D", "#3D5266"]
    : isSunrise
    ? ["#FFD6A5", "#FFAA7F", "#E8D5B7"]
    : isDay
    ? ["#E8F4FD", "#D4ECF8", "#CFDBC4"]
    : ["#FFE6BD", "#FFD0A1", "#CFDBC4"];

  const sunColor = isNight
    ? "#E8E8F0"
    : isSunrise
    ? "#FF8C42"
    : isDay
    ? "#FFF8E1"
    : "#FFEDB0";
  const sunGlow = isNight
    ? "#A8B4C8"
    : isSunrise
    ? "#FFB347"
    : isDay
    ? "#FBE5A6"
    : "#FFB36A";

  const sunY = isNight ? 45 : isSunrise ? 155 : isDay ? 55 : 95;
  const sunX = isNight ? 1100 : isSunrise ? 220 : isDay ? 1020 : 1020;
  const sunR = isNight ? 22 : isSunrise ? 40 : isDay ? 44 : 38;
  const moonPhase = isNight;

  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 240"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyColors[0]} />
          <stop offset="0.4" stopColor={skyColors[1]} />
          <stop offset="1" stopColor={skyColors[2]} />
        </linearGradient>
        <linearGradient id="hero-leaf-a" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#A6CFA1" />
          <stop offset="1" stopColor="#5A8A5F" />
        </linearGradient>
        <linearGradient id="hero-leaf-b" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#B7D9B0" />
          <stop offset="1" stopColor="#6B9168" />
        </linearGradient>
        <linearGradient id="hero-leaf-c" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#8FBC8F" />
          <stop offset="1" stopColor="#4E6C54" />
        </linearGradient>
        <linearGradient id="hero-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9EC59E" />
          <stop offset="1" stopColor="#6B8F71" />
        </linearGradient>
      </defs>

      <rect width="1200" height="240" fill="url(#hero-sky)" />

      {isNight && (
        <>
          <g fill="#FFFFFF" opacity="0.15">
            <circle cx="180" cy="38" r="1.2" />
            <circle cx="320" cy="62" r="0.8" />
            <circle cx="480" cy="28" r="1" />
            <circle cx="620" cy="55" r="0.6" />
            <circle cx="780" cy="35" r="1.4" />
            <circle cx="850" cy="68" r="0.9" />
            <circle cx="980" cy="22" r="1.1" />
            <circle cx="1150" cy="48" r="0.7" />
            <circle cx="130" cy="82" r="0.5" />
            <circle cx="440" cy="75" r="0.8" />
            <circle cx="700" cy="18" r="0.6" />
            <circle cx="1050" cy="70" r="1" />
          </g>
          <g opacity="0.15">
            <circle cx="1100" cy="45" r="70" fill={sunGlow} />
            <circle cx="1100" cy="45" r="40" fill={sunGlow} opacity="0.35" />
          </g>
        </>
      )}

      {!isNight && (
        <g opacity={isSunrise ? "0.45" : isDay ? "0.65" : "0.85"}>
          <circle cx={sunX} cy={sunY} r={sunR * 3} fill={sunGlow} opacity="0.2" />
          <circle cx={sunX} cy={sunY} r={sunR * 2} fill={sunGlow} opacity="0.35" />
          <circle cx={sunX} cy={sunY} r={sunR} fill={sunColor} />
          <circle cx={sunX} cy={sunY} r={sunR * 0.55} fill="#FFFFFF" opacity="0.4" />
        </g>
      )}

      {moonPhase && (
        <g fill="#E8E8F0" opacity="0.8">
          <circle cx={sunX + 8} cy={sunY - 4} r={sunR * 0.6} fill="#2B3A4D" />
        </g>
      )}

      <g fill="#FFFFFF" opacity={isNight ? "0.12" : "0.55"}>
        <ellipse cx="120" cy="42" rx="34" ry="6" />
        <ellipse cx="100" cy="38" rx="20" ry="5" />
        <ellipse cx="320" cy="56" rx="42" ry="7" />
        <ellipse cx="298" cy="50" rx="22" ry="5" />
        <ellipse cx="560" cy="36" rx="36" ry="6" />
        <ellipse cx="780" cy="58" rx="48" ry="7" />
        <ellipse cx="758" cy="52" rx="24" ry="5" />
        <ellipse cx="960" cy="40" rx="32" ry="6" />
      </g>

      <g fill="none" stroke="#5C7C61" strokeWidth="1.8" strokeLinecap="round" opacity="0.65">
        <path d="M620 38 q-8 -6 -16 0 q-2 -6 -10 -3" />
        <path d="M680 54 q-10 -8 -20 0 q-2 -8 -12 -4" />
        <path d="M820 32 q-10 -8 -20 0 q-2 -8 -12 -4" />
        <path d="M870 58 q-8 -6 -16 0 q-2 -6 -10 -3" />
        <path d="M930 38 q-10 -8 -20 0 q-2 -8 -12 -4" />
        <path d="M990 60 q-8 -6 -16 0 q-2 -6 -10 -3" />
        <path d="M1100 78 q-10 -8 -20 0 q-2 -8 -12 -4" />
        <path d="M1140 50 q-8 -6 -16 0 q-2 -6 -10 -3" />
      </g>

      <g opacity="0.55">
        <path
          d="M0 175 Q60 158 130 165 Q200 152 280 162 Q360 150 440 158 Q520 148 600 156 Q680 146 760 154 Q840 144 920 152 Q1000 144 1080 152 Q1140 146 1200 152 L1200 200 L0 200 Z"
          fill="#B5CDA8"
        />
      </g>

      <g opacity="0.7">
        <path
          d="M0 195 Q60 178 130 186 Q200 174 280 184 Q360 172 440 182 Q520 172 600 180 Q680 170 760 180 Q840 170 920 178 Q1000 170 1080 178 Q1140 172 1200 178 L1200 240 L0 240 Z"
          fill="#9EBE92"
        />
      </g>

      <g opacity="0.85">
        <ellipse cx="40" cy="208" rx="18" ry="14" fill="url(#hero-leaf-a)" />
        <ellipse cx="28" cy="206" rx="12" ry="10" fill="#A6CFA1" />
        <ellipse cx="52" cy="206" rx="12" ry="10" fill="#7CA582" />
      </g>

      <g opacity="0.85">
        <ellipse cx="115" cy="212" rx="16" ry="12" fill="url(#hero-leaf-b)" />
        <ellipse cx="125" cy="208" rx="10" ry="8" fill="#B7D9B0" />
      </g>

      <g opacity="0.85">
        <ellipse cx="210" cy="210" rx="20" ry="14" fill="url(#hero-leaf-a)" />
        <ellipse cx="198" cy="206" rx="12" ry="10" fill="#A6CFA1" />
      </g>

      <g opacity="0.85">
        <ellipse cx="295" cy="214" rx="16" ry="11" fill="#9EC59E" />
        <ellipse cx="305" cy="210" rx="10" ry="8" fill="#B7D9B0" />
      </g>

      <g opacity="0.85">
        <ellipse cx="380" cy="212" rx="22" ry="14" fill="url(#hero-leaf-c)" />
        <ellipse cx="368" cy="208" rx="12" ry="10" fill="#8FBC8F" />
        <ellipse cx="392" cy="208" rx="12" ry="10" fill="#6B8F71" />
      </g>

      <g opacity="0.85">
        <ellipse cx="470" cy="214" rx="18" ry="12" fill="#A6CFA1" />
        <ellipse cx="482" cy="210" rx="10" ry="8" fill="#B7D9B0" />
      </g>

      <g opacity="0.9">
        <path d="M555 220 L555 188" stroke="#7E6240" strokeWidth="2.2" strokeLinecap="round" />
        <polygon points="555,168 542,198 568,198" fill="#5A8A5F" />
        <polygon points="555,180 545,204 565,204" fill="#7CA582" />
      </g>

      <g opacity="0.85">
        <ellipse cx="635" cy="214" rx="16" ry="12" fill="#9EC59E" />
        <ellipse cx="645" cy="210" rx="10" ry="8" fill="#B7D9B0" />
      </g>

      <g opacity="0.95">
        <path d="M730 215 L730 152" stroke="#7E6240" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="730" cy="142" rx="32" ry="40" fill="url(#hero-leaf-a)" />
        <ellipse cx="708" cy="124" rx="20" ry="28" fill="#A6CFA1" />
        <ellipse cx="752" cy="124" rx="20" ry="28" fill="#6B8F71" />
      </g>

      <g opacity="0.92">
        <path d="M820 220 L820 184" stroke="#7E6240" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="820" cy="178" rx="16" ry="22" fill="#B7D9B0" />
      </g>

      <g opacity="0.95">
        <path d="M905 218 L905 156" stroke="#7E6240" strokeWidth="3.5" strokeLinecap="round" />
        <polygon points="905,128 885,180 925,180" fill="#5A8A5F" />
        <polygon points="905,148 891,190 919,190" fill="#7CA582" />
      </g>

      <g opacity="0.95">
        <path d="M1000 215 L1000 105" stroke="#7E6240" strokeWidth="4.5" strokeLinecap="round" />
        <ellipse cx="1000" cy="98" rx="48" ry="60" fill="url(#hero-leaf-c)" />
        <ellipse cx="976" cy="78" rx="28" ry="36" fill="#8FBC8F" />
        <ellipse cx="1024" cy="78" rx="28" ry="36" fill="#6B8F71" />
      </g>

      <g opacity="0.92">
        <path d="M1090 216 L1090 158" stroke="#7E6240" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="1090" cy="150" rx="22" ry="28" fill="url(#hero-leaf-b)" />
        <ellipse cx="1078" cy="138" rx="14" ry="20" fill="#B7D9B0" />
      </g>

      <g opacity="0.88">
        <path d="M1160 220 L1160 184" stroke="#7E6240" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="1160" cy="178" rx="16" ry="22" fill="#A6CFA1" />
      </g>

      <g fill="#7A9E78" opacity="0.85">
        <path d="M70 222 L73 200 L67 200 Z" />
        <path d="M150 224 L153 204 L147 204 Z" />
        <path d="M250 222 L253 202 L247 202 Z" />
        <path d="M335 224 L338 204 L332 204 Z" />
        <path d="M425 222 L428 202 L422 202 Z" />
        <path d="M510 224 L513 204 L507 204 Z" />
        <path d="M595 222 L598 202 L592 202 Z" />
        <path d="M685 224 L688 204 L682 204 Z" />
        <path d="M775 222 L778 202 L772 202 Z" />
        <path d="M860 224 L863 204 L857 204 Z" />
        <path d="M955 222 L958 202 L952 202 Z" />
        <path d="M1045 224 L1048 204 L1042 204 Z" />
        <path d="M1130 222 L1133 202 L1127 202 Z" />
      </g>

      <g fill="url(#hero-grass)" opacity="0.95">
        <path d="M0 240 L0 222 Q15 212 28 222 Q42 208 56 222 Q70 214 84 224 Q98 214 112 226 Q126 216 140 226 Q154 218 168 228 Q182 218 196 230 Q210 220 224 230 Q238 222 252 232 Q266 222 280 232 Q294 224 308 234 Q322 224 336 234 Q350 226 364 236 Q378 226 392 236 Q406 228 420 238 Q434 228 448 240 Q462 230 476 240 Q490 232 504 240 Q518 232 532 240 Q546 234 560 240 Q574 234 588 240 Q602 234 616 240 Q630 234 644 240 Q658 234 672 240 Q686 234 700 240 Q714 234 728 240 Q742 234 756 240 Q770 234 784 240 Q798 234 812 240 Q826 234 840 240 Q854 234 868 240 Q882 234 896 240 Q910 234 924 240 Q938 234 952 240 Q966 234 980 240 Q994 234 1008 240 Q1022 234 1036 240 Q1050 234 1064 240 Q1078 234 1092 240 Q1106 234 1120 240 Q1134 234 1148 240 Q1162 234 1176 240 Q1190 234 1200 240 L1200 240 Z" />
      </g>

      <g stroke="#6B8F71" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M30 240 Q32 228 30 218" />
        <path d="M48 240 Q50 230 48 222" />
        <path d="M88 240 Q90 228 88 220" />
        <path d="M132 240 Q134 230 132 222" />
        <path d="M178 240 Q180 228 178 218" />
        <path d="M222 240 Q224 230 222 222" />
        <path d="M268 240 Q270 228 268 220" />
        <path d="M318 240 Q320 230 318 222" />
        <path d="M362 240 Q364 228 362 218" />
        <path d="M408 240 Q410 230 408 222" />
        <path d="M452 240 Q454 228 452 220" />
        <path d="M498 240 Q500 230 498 222" />
        <path d="M548 240 Q550 228 548 218" />
        <path d="M598 240 Q600 230 598 222" />
        <path d="M646 240 Q648 228 646 220" />
        <path d="M692 240 Q694 230 692 222" />
        <path d="M738 240 Q740 228 738 218" />
        <path d="M788 240 Q790 230 788 222" />
        <path d="M838 240 Q840 228 838 220" />
        <path d="M886 240 Q888 230 886 222" />
        <path d="M936 240 Q938 228 936 218" />
        <path d="M984 240 Q986 230 984 222" />
        <path d="M1032 240 Q1034 228 1032 220" />
        <path d="M1078 240 Q1080 230 1078 222" />
        <path d="M1126 240 Q1128 228 1126 218" />
        <path d="M1170 240 Q1172 230 1170 222" />
      </g>

      <g fill="#FFFFFF" opacity="0.9">
        <circle cx="245" cy="218" r="2.4" />
        <circle cx="247" cy="216" r="1.6" />
        <circle cx="380" cy="220" r="2.4" />
        <circle cx="378" cy="218" r="1.6" />
        <circle cx="540" cy="222" r="2.4" />
        <circle cx="538" cy="220" r="1.6" />
        <circle cx="680" cy="220" r="2.4" />
        <circle cx="678" cy="218" r="1.6" />
        <circle cx="830" cy="222" r="2.4" />
        <circle cx="828" cy="220" r="1.6" />
        <circle cx="970" cy="220" r="2.4" />
        <circle cx="968" cy="218" r="1.6" />
      </g>
      <g fill="#F4D35E" opacity="0.85">
        <circle cx="180" cy="220" r="2" />
        <circle cx="320" cy="222" r="2" />
        <circle cx="450" cy="220" r="2" />
        <circle cx="610" cy="222" r="2" />
        <circle cx="760" cy="220" r="2" />
        <circle cx="900" cy="222" r="2" />
        <circle cx="1060" cy="220" r="2" />
      </g>
      <g fill="#E26A6A" opacity="0.75">
        <circle cx="280" cy="220" r="1.8" />
        <circle cx="510" cy="222" r="1.8" />
        <circle cx="730" cy="220" r="1.8" />
        <circle cx="870" cy="222" r="1.8" />
        <circle cx="1020" cy="220" r="1.8" />
      </g>

      <g fill="#D4A017" opacity="0.85">
        <path d="M165 175 Q170 169 175 173 Q170 171 165 175 M165 175 Q160 169 155 173 Q161 171 165 175" />
        <path d="M425 165 Q430 159 435 163 Q430 161 425 165 M425 165 Q420 159 415 163 Q421 161 425 165" />
        <path d="M675 158 Q680 152 685 156 Q680 154 675 158 M675 158 Q670 152 665 156 Q671 154 675 158" />
        <path d="M885 170 Q890 164 895 168 Q890 166 885 170 M885 170 Q880 164 875 168 Q881 166 885 170" />
      </g>
      <g fill="#E26A6A" opacity="0.78">
        <path d="M340 188 Q345 182 350 186 Q345 184 340 188 M340 188 Q335 182 330 186 Q341 184 340 188" />
        <path d="M620 175 Q625 169 630 173 Q625 171 620 175 M620 175 Q615 169 610 173 Q621 171 620 175" />
        <path d="M820 192 Q825 186 830 190 Q825 188 820 192 M820 192 Q815 186 810 190 Q821 188 820 192" />
        <path d="M1050 180 Q1055 174 1060 178 Q1055 176 1050 180 M1050 180 Q1045 174 1040 178 Q1051 176 1050 180" />
      </g>

      <g fill="#3A5A40" opacity="0.5">
        <path d="M125 215 q-1 -10 4 -14 q-2 -3 0 -6 q3 2 4 5 q-1 2 -1 4 q4 4 4 11 q-3 1 -5 -1 q-1 1 -3 1 q-2 0 -3 0 z" />
        <path d="M138 218 q-1 -8 3 -12 q3 4 3 12 z" />
      </g>

      <g fill="#4A3B2A" opacity="0.45">
        <path d="M605 210 q-2 -16 6 -20 q-3 -4 0 -8 q4 3 5 7 q-1 3 -1 5 q6 5 6 16 q-4 1 -7 -1 q-2 1 -4 1 q-3 0 -5 0 z" />
        <path d="M622 215 q-1 -12 4 -16 q4 5 4 16 z" />
        <circle cx="616" cy="195" r="3" fill="#4A3B2A" />
      </g>

      <g fill="#7A5A38" opacity="0.5">
        <ellipse cx="468" cy="222" rx="6" ry="3" />
        <circle cx="473" cy="220" r="2.2" />
        <path d="M470 218 q1 -3 3 -3" stroke="#7A5A38" strokeWidth="1" fill="none" />
      </g>

      <g fill="#FFFFFF" opacity="0.55">
        <circle cx="1080" cy="225" r="2" />
        <circle cx="1095" cy="222" r="1.5" />
        <circle cx="1110" cy="226" r="1.8" />
        <circle cx="1125" cy="223" r="1.4" />
      </g>
      <g fill="#FF8FA3" opacity="0.6">
        <ellipse cx="1085" cy="218" rx="3" ry="1" />
        <circle cx="1085" cy="216" r="1" />
      </g>

      <g fill="#9EC59E" opacity="0.55">
        <path d="M210 215 q-2 -10 0 -16" stroke="#9EC59E" strokeWidth="1.4" fill="none" />
        <path d="M214 218 q-1 -8 1 -12" stroke="#9EC59E" strokeWidth="1.4" fill="none" />
      </g>
    </svg>
  );
});
