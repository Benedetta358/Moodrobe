import React, { useId } from "react";
// Original garment illustrations; decorative fashion assets, not interface icons.
export default function Garment({ item, className = "" }) {
  const uid = useId().replace(/:/g, "");
  if (item.image)
    return (
      <img
        className={`garment photo ${className}`}
        src={item.image}
        alt={item.name}
      />
    );
  if (item.demo && /^demo-\d+$/.test(item.id)) {
    const n = Number(item.id.split("-")[1]);
    return (
      <div
        role="img"
        aria-label={item.name}
        className={`garment sample-photo ${className}`}
        style={{
          backgroundImage: "url(/images/sample-wardrobe.png)",
          backgroundSize: "400% 400%",
          backgroundPosition: `${((n % 4) * 100) / 3}% ${(Math.floor(n / 4) * 100) / 3}%`,
        }}
      />
    );
  }
  const c = item.hex || "#ccc",
    shape = item.shape;
  const paths = {
    knit: (
      <>
        <path d="M66 49 91 35q19 19 38 0l25 14 31 60-29 13-15-32v113H79V90l-15 32-29-13Z" />
        <path
          d="M91 35q19 33 38 0M82 191h56M41 105l24 10M154 115l24-10"
          className="seam"
        />
        <path
          d="M87 75v105m12-107v107m12-107v107m12-107v107m12-107v107"
          className="rib"
        />
      </>
    ),
    shirt: (
      <>
        <path d="m75 46 21-14h28l21 14 37 61-26 16-17-29 4 109H77l4-109-17 29-26-16Z" />
        <path
          d="m96 32-10 25 24 16 24-16-10-25M110 73v130m12-119h14v25h-14"
          className="seam"
        />
        <circle cx="113" cy="99" r="1.8" />
        <circle cx="113" cy="125" r="1.8" />
        <circle cx="113" cy="152" r="1.8" />
      </>
    ),
    tee: (
      <>
        <path d="m78 48 18-10q14 15 28 0l18 10 36 35-22 25-17-15v107H81V93l-17 15-22-25Z" />
        <path d="M96 38q14 26 28 0M84 188h52" className="seam" />
      </>
    ),
    blazer: (
      <>
        <path d="m82 42 16-8h24l16 8 15 14 20 143-28 3-10-103 5 108H80l5-108-10 103-28-3L67 56Z" />
        <path
          d="m98 34-11 41 23 38 23-38-11-41m-12 79v94m-28-59h20m17 0h19"
          className="seam"
        />
        <circle cx="115" cy="141" r="2.4" />
        <circle cx="115" cy="166" r="2.4" />
      </>
    ),
    cardigan: (
      <>
        <path d="m78 43 20-8h24l20 8 31 141-28 5-11-89 5 108H81l5-108-11 89-28-5Z" />
        <path
          d="m98 35 12 69 12-69m-12 69v104m-26-23h18m17 0h16"
          className="seam"
        />
        {[117, 140, 163, 186].map((y) => (
          <circle key={y} cx="113" cy={y} r="2" />
        ))}
      </>
    ),
    coat: (
      <>
        <path d="m80 39 18-9h24l18 9 14 17 20 138-26 5-12-93 9 113H75l9-113-12 93-26-5L66 56Z" />
        <path
          d="m98 30-13 43 25 36 25-36-13-43m-12 79v110M79 154h24m16 0h24"
          className="seam"
        />
      </>
    ),
    pants: (
      <>
        <path d="M75 38h70l-4 71 14 107-37 3-10-112-8 112-35-3 12-107Z" />
        <path
          d="M76 48h67m-33 1v44l-8 12m-24-53-1 28m63-28v28M90 110l-8 101m48-101 9 101"
          className="seam"
        />
      </>
    ),
    jeans: (
      <>
        <path d="M74 38h72l-5 72 14 106-37 3-9-111-10 111-34-3 12-106Z" />
        <path
          d="M76 50h68m-34 0v42l-8 13M78 55q12 22 25 0m13 0q13 22 25 0M87 112l-8 99m49-99 13 99"
          className="seam"
        />
      </>
    ),
    skirt: (
      <>
        <path d="M81 48h58l34 148q-63 22-126 0Z" />
        <path
          d="M81 59h58M87 64 69 198m31-134-6 139m25-139 6 139m8-139 19 134"
          className="seam"
        />
      </>
    ),
    dress: (
      <>
        <path d="m91 31 13 4h12l13-4 10 32-14 42 39 107q-54 16-108 0l39-107-14-42Z" />
        <path
          d="M94 100h32m-22-65q6 27 12 0M92 116l-17 89m44-89 21 89"
          className="seam"
        />
      </>
    ),
    sneakers: (
      <>
        <path d="m39 130 20-28 27 7 31 29 49 12 17 18-6 17H39q-15-2-14-18Z" />
        <path
          d="M27 170h153M84 120l-17 17m32-6-17 18m34-6-15 14M49 151l9-27"
          className="seam"
        />
        <path d="m85 69 20-20 23 11 23 30 34 15 10 17-12 13-48-11-37-18-20-17Z" />
        <path d="m90 89 90 35m-56-50-16 12m28 0-14 12" className="seam" />
      </>
    ),
    loafers: (
      <>
        <path d="m43 118 18-20 31 5 26 34 39 13q26 10 21 29l-8 7H44q-24-13-16-38Z" />
        <path
          d="M29 173h148M48 125q20-18 43 3l20 24H39Zm7-1 4 14 31 3-2-15"
          className="seam"
        />
        <path d="m109 64 21-14 23 9 28 46 9 22-12 12-33-8-45-41Z" />
        <path d="m117 82 36 17 9-13" className="seam" />
      </>
    ),
    flats: (
      <>
        <path d="m39 118 30-17 32 9 40 42q41 9 39 28-3 10-25 9H58q-41-4-35-29Z" />
        <path
          d="M41 140q36-35 73 13M27 176h150m-76-24 12 7-8 9m8-9 12-6-3 11"
          className="seam"
        />
      </>
    ),
    bag: (
      <>
        <path d="M62 90h96l14 105q-62 21-124 0Z" />
        <path
          d="M85 97V72q0-44 25-44t25 44v25M65 106h90m-45 0v91"
          className="seam"
        />
        <path d="M102 127h16v12h-16Z" fill="#c3a369" />
      </>
    ),
    scarf: (
      <>
        <path d="m67 48 83 19-31 44 45 80-29 23-47-93-36 16Z" />
        <path
          d="m67 48 43 47 40-28m-40 28-22 26m31-10-31 10m32 35 25-15m-15 35 25-15"
          className="seam"
        />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 220 240"
      className={`garment ${className}`}
      role="img"
      aria-label={item.name}
    >
      <defs>
        <filter
          id={`shadow-${uid}`}
          x="-30%"
          y="-30%"
          width="160%"
          height="170%"
        >
          <feDropShadow
            dx="2"
            dy="9"
            stdDeviation="6"
            floodColor="#3a3026"
            floodOpacity=".13"
          />
        </filter>
        <linearGradient id={`fabric-${uid}`}>
          <stop stopColor={c} />
          <stop offset=".45" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity=".82" />
        </linearGradient>
      </defs>
      <g
        fill={`url(#fabric-${uid})`}
        stroke="#302a22"
        strokeOpacity=".15"
        strokeWidth="1.2"
        strokeLinejoin="round"
        filter={`url(#shadow-${uid})`}
      >
        {paths[shape] || paths.tee}
      </g>
    </svg>
  );
}
