import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function Navbar() {
    const mobileMenuIconRef = useRef(null);
    const mobileNavLinksRef = useRef(null);

    useEffect(() => {
        const mobileMenuIcon = mobileMenuIconRef.current;
        const mobileNavLinks = mobileNavLinksRef.current;

        if (mobileMenuIcon && mobileNavLinks) {
            // Toggle mobile menu when icon is clicked
            const toggleMenu = (e) => {
                e.stopPropagation();
                mobileNavLinks.classList.toggle("active");
            };

            // Close mobile menu when clicking anywhere else
            const closeMenu = (e) => {
                if (
                    !mobileMenuIcon.contains(e.target) &&
                    !mobileNavLinks.contains(e.target)
                ) {
                    mobileNavLinks.classList.remove("active");
                }
            };

            // Prevent closing when clicking inside the mobile menu
            const stopPropagation = (e) => {
                e.stopPropagation();
            };

            mobileMenuIcon.addEventListener("click", toggleMenu);
            document.addEventListener("click", closeMenu);
            mobileNavLinks.addEventListener("click", stopPropagation);

            return () => {
                mobileMenuIcon.removeEventListener("click", toggleMenu);
                document.removeEventListener("click", closeMenu);
                mobileNavLinks.removeEventListener("click", stopPropagation);
            };
        }
    }, []);

    return (
        <nav className="navbar">
            <div className="logo">
                <Link to="/">
                    <img src="/Photo/VehicleValuationMainIcon.svg" alt="" />
                </Link>
            </div>
            <ul className="nav-links">
                <li className="nav-item dropdown">
                    <div className="dropdown-head">
                        <a href="#home">Resources</a>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>

                    <ul className="dropdown-menu">
                        <li>
                            <Link to="/vehicle-price">Vehicle Price</Link>
                        </li>
                        <li>
                            <Link to="/recommended">Recommended</Link>
                        </li>
                    </ul>
                </li>
                <li>
                    <Link to="/" state={{ scrollTo: "about" }}>
                        About Us
                    </Link>
                </li>
                <li>
                    <Link to="/" state={{ scrollTo: "contact" }}>
                        Contact Us
                    </Link>
                </li>
            </ul>
            <svg
                ref={mobileMenuIconRef}
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
            >
                <path
                    fillRule="evenodd"
                    d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm8.25 5.25a.75.75 0 0 1 .75-.75h8.25a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75Z"
                    clipRule="evenodd"
                />
            </svg>
            <ul ref={mobileNavLinksRef} className="nav-links-mobile">
                <li>
                    <Link to="/vehicle-price">Vehicle Price</Link>
                </li>
                <li>
                    <Link to="/recommended">Recommended</Link>
                </li>
                <li>
                    <Link to="/" state={{ scrollTo: "about" }}>
                        About Us
                    </Link>
                </li>
                <li>
                    <Link to="/" state={{ scrollTo: "contact" }}>
                        Contact Us
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar;
