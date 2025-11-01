import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { Input } from "./ui";
import { useGlobalSearch } from "../hooks/useGlobalSearch";
import { GlobalSearchResults } from "./GlobalSearchResults";
import type { GlobalSearchResult } from "./searchTypes";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    if (!isSearchActive) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchActive]);

  const { data: globalSearchResults = [], isLoading: isGlobalSearchLoading } =
    useGlobalSearch(debouncedSearch, 5);

  const handleSearchSelect = (result: GlobalSearchResult) => {
    setSearchTerm("");
    setDebouncedSearch("");
    setIsSearchActive(false);
    navigate(result.path);
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && globalSearchResults.length > 0) {
      event.preventDefault();
      handleSearchSelect(globalSearchResults[0]);
    }

    if (event.key === "Escape") {
      setIsSearchActive(false);
    }
  };

  const shouldShowSearchResults =
    isSearchActive && debouncedSearch.trim().length > 0;

  const userInitials =
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";

  const profileAriaLabel =
    user?.firstName || user?.lastName
      ? `Open profile menu for ${[user?.firstName, user?.lastName].filter(Boolean).join(" ")}`
      : "Open profile menu";

  type NavigationItem = {
    name: string;
    href: string;
    exact?: boolean;
    excludePrefixes?: string[];
  };

  const navigation: NavigationItem[] = [
    { name: "Accounts", href: "/accounts" },
    { name: "Leads", href: "/leads" },
    { name: "Contacts", href: "/contacts" },
    { name: "Activities", href: "/activities" },
    { name: "Issues", href: "/issues" },
    { name: "Tasks", href: "/tasks" },
    {
      name: "Opportunities",
      href: "/opportunities",
      excludePrefixes: ["/opportunities/board"],
    },
    { name: "Pipeline Board", href: "/opportunities/board", exact: true },
    { name: "Employees", href: "/employees" },
    { name: "Products", href: "/products" },
    { name: "Migration Cockpit", href: "/settings/data" },
    { name: "Workflows", href: "/settings/workflows" },
  ];

  const isActive = (
    path: string,
    options?: { exact?: boolean; excludePrefixes?: string[] },
  ) => {
    if (options?.exact) {
      return location.pathname === path;
    }

    if (
      options?.excludePrefixes?.some((prefix) =>
        location.pathname.startsWith(prefix),
      )
    ) {
      return false;
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((previous) => !previous);
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    return () => {
      setIsProfileMenuOpen(false);
    };
  }, [isProfileMenuOpen, location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <div className="flex flex-1 items-center gap-4 min-w-0">
              {/* Hamburger menu button */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>

              {/* Logo - now clickable */}
              <Link to="/">
                <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                  CRM System
                </h1>
              </Link>
            </div>

            {/* Global search */}
            <div className="hidden flex-1 sm:flex">
              <div
                ref={searchContainerRef}
                className="relative mx-auto w-full max-w-xl"
              >
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onFocus={() => setIsSearchActive(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search accounts, contacts, leads, opportunities..."
                  aria-label="Global search"
                  autoComplete="off"
                />
                {shouldShowSearchResults && (
                  <GlobalSearchResults
                    query={debouncedSearch}
                    isLoading={isGlobalSearchLoading}
                    results={globalSearchResults}
                    onSelect={handleSearchSelect}
                  />
                )}
              </div>
            </div>

            {/* User menu - right side */}
            <div className="flex flex-1 items-center justify-end gap-4">
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 transition-colors hover:bg-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-primary-900 dark:text-primary-100 dark:hover:bg-primary-800 dark:focus-visible:ring-primary-300 dark:focus-visible:ring-offset-gray-900"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  aria-label={profileAriaLabel}
                >
                  <span className="text-sm font-medium">{userInitials}</span>
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                      >
                        Profile settings
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full px-4 py-2 text-left text-sm text-error-600 transition-colors hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-900/20"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay - left side */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/50 dark:bg-gray-950/70 z-40 transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <nav className="fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Sidebar header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  CRM System
                </Link>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Navigation links */}
              <div className="flex-1 px-4 py-4 overflow-y-auto">
                <div className="flex flex-col space-y-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeMobileMenu}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href, {
                          exact: item.exact,
                          excludePrefixes: item.excludePrefixes,
                        })
                          ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        </>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
