import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContect.jsx";

const AnimatedBackground = () => {
	const { theme } = useTheme(); // Get current theme
	const blobRefs = useRef([]);

	// Blob colors based on theme
	const blobColors =
		theme === "dark"
			? ["#c2410c", "#f43f5e", "#991b1b", "#dc2626"]
			: ["#fca5a5", "#f87171", "#fca5a5", "#fca5a5"];

	const gridColor = theme === "dark" ? "rgba(79,79,79,0.06)" : "rgba(220,38,38,0.08)";

	useEffect(() => {
		const initialPositions = [
			{ x: -4, y: 0 },
			{ x: -4, y: 0 },
			{ x: 20, y: -8 },
			{ x: 20, y: -8 },
		];

		let requestId;

		const handleScroll = () => {
			const scrollY = window.pageYOffset;

			blobRefs.current.forEach((blob, index) => {
				if (!blob) return;
				const pos = initialPositions[index];

				const xOffset = Math.sin(scrollY / 100 + index * 0.5) * 340;
				const yOffset = Math.cos(scrollY / 100 + index * 0.5) * 40;

				blob.style.transform = `translate(${pos.x + xOffset}px, ${pos.y + yOffset}px)`;
				blob.style.transition = "transform 1.4s ease-out, background-color 0.5s ease";
				blob.style.backgroundColor = blobColors[index]; // dynamic color
			});

			requestId = requestAnimationFrame(handleScroll);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // initial call

		return () => {
			window.removeEventListener("scroll", handleScroll);
			cancelAnimationFrame(requestId);
		};
	}, [theme]); // re-run on theme change

	return (
		<div className="fixed inset-0 animated-bg z-0" id="Home">
			<div className="absolute inset-0">
				{[0, 1, 2, 3].map((i) => (
					<div
						key={i}
						ref={(ref) => (blobRefs.current[i] = ref)}
						className={`absolute md:w-96 md:h-96 w-72 h-72 rounded-full mix-blend-multiply filter blur-[128px] ${
							i === 3 ? "opacity-20 md:opacity-10 hidden sm:block" : "opacity-30 md:opacity-15"
						}`}
						style={{
							top: i === 0 ? "0" : i === 1 ? "0" : undefined,
							left: i === 0 ? "-1rem" : i === 2 ? "-40%" : i === 2 ? "20" : undefined,
							right: i === 1 ? "-1rem" : i === 3 ? "5rem" : undefined,
							bottom: i === 2 ? "-2rem" : i === 3 ? "-2.5rem" : undefined,
							backgroundColor: blobColors[i],
						}}
					/>
				))}
			</div>

			{/* Grid overlay */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `
            linear-gradient(to right, ${gridColor} 1px, transparent 1px),
            linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
          `,
					backgroundSize: "24px 24px",
					transition: "background 0.5s ease",
				}}
			/>
		</div>
	);
};

export default AnimatedBackground;
