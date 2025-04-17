import React from "react";
import { Home, History, Gamepad2, User, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Navigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };
  
  return (
    <footer className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-2 md:py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/">
            <div className={`p-2 ${isActive("/") ? "text-primary" : "text-gray-600 hover:text-gray-900"}`}>
              <Home className="text-xl w-5 h-5" />
            </div>
          </Link>
          
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <History className="text-xl w-5 h-5" />
          </button>
          
          {/* Game - This menu item is highlighted when in a game */}
          <Link href={location.startsWith("/games/") ? location : "/"}>
            <div className={`p-2 ${location.startsWith("/games/") ? "text-primary" : "text-gray-600 hover:text-gray-900"}`}>
              <Gamepad2 className="text-xl w-5 h-5" />
            </div>
          </Link>
          
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <User className="text-xl w-5 h-5" />
          </button>
          
          <button className="p-2 text-gray-600 hover:text-gray-900">
            <Settings className="text-xl w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
