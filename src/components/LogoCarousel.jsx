import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./LogoCarousel.css";

// Define types
const logos = [
  {
    id: 1,
    name: "Machankura",
    src: "https://btcdada.com/wp-content/uploads/2023/12/1.png",
  },
  {
    id: 2,
    name: "Human Rights Foundation",
    src: "https://btcdada.com/wp-content/uploads/2023/12/2.png",
  },
  {
    id: 3,
    name: "SAMARA ASSET GROUP",
    src: "https://btcdada.com/wp-content/uploads/2023/12/3.png",
  },
  {
    id: 4,
    name: "Trezor Academy",
    src: "https://btcdada.com/wp-content/uploads/2025/02/Trezor.png",
  },
  {
    id: 5,
    name: "Bitnob",
    src: "https://btcdada.com/wp-content/uploads/2025/02/Bitnob.png",
  },
];

// Column component
function LogoColumn({ logos, columnIndex, currentTime }) {
  const CYCLE_DURATION = 4000; // 4 seconds per logo for slower animation
  const columnDelay = columnIndex * 300; // Increased delay for smoother stagger
  const adjustedTime =
    (currentTime + columnDelay) % (CYCLE_DURATION * logos.length);
  const currentIndex = Math.floor(adjustedTime / CYCLE_DURATION);
  const currentLogo = logos[currentIndex];

  return (
    <motion.div
      className="logo-column"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: columnIndex * 0.15,
        duration: 0.8,
        ease: "easeInOut",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentLogo.id}-${currentIndex}`}
          className="logo-item"
          initial={{ y: "10%", opacity: 0 }}
          animate={{
            y: "0%",
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 200,
              damping: 30,
              mass: 1.2,
            },
          }}
          exit={{
            y: "-20%",
            opacity: 0,
            transition: { 
              duration: 0.6,
              ease: "easeInOut"
            },
          }}
        >
          <img
            src={currentLogo.src}
            alt={currentLogo.name}
            className="logo-image"
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// Main component
export function LogoCarousel({ columns = 3 }) {
  const [logoColumns, setLogoColumns] = useState([]);
  const [time, setTime] = useState(0);

  // Distribute logos across columns
  const distributeLogos = useCallback(
    (logos) => {
      // Create a circular distribution where each column cycles through all logos
      // with a different starting offset for visual variety
      const result = Array.from({ length: columns }, () => []);

      // Each column gets all logos, but starts at a different index
      // This creates a staggered, circular effect
      const logosPerColumn = Math.ceil(logos.length / columns) + 2; // Extra logos for smooth cycling
      
      result.forEach((col, colIndex) => {
        for (let i = 0; i < logosPerColumn; i++) {
          // Calculate which logo to show: start at colIndex offset, then cycle
          const logoIndex = (colIndex + i * columns) % logos.length;
          col.push(logos[logoIndex]);
        }
      });

      return result;
    },
    [columns]
  );

  // Initialize logo columns
  useEffect(() => {
    setLogoColumns(distributeLogos(logos));
  }, [distributeLogos]);

  // Update time for animation - slower for smoother transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 50);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="logo-carousel-container">
      {logoColumns.map((columnLogos, index) => (
        <LogoColumn
          key={index}
          logos={columnLogos}
          columnIndex={index}
          currentTime={time}
        />
      ))}
    </div>
  );
}

export default LogoCarousel;

