
import React, { useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ sidebar, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div 
        className={`fixed md:relative inset-y-0 left-0 z-20 transform bg-sidebar transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
        } ${sidebarOpen ? 'w-64' : 'w-0 md:w-16'}`}
      >
        {sidebarOpen ? (
          <div className="w-full h-full overflow-y-auto">{sidebar}</div>
        ) : (
          <div className="hidden md:block w-full h-full overflow-y-auto py-6">
            {/* Collapsed sidebar content */}
            <div className="flex flex-col items-center space-y-4">
              {React.Children.map(sidebar as React.ReactElement, (child) => {
                if (child?.props?.collapsedIcon) {
                  return child.props.collapsedIcon;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-10 bg-black bg-opacity-30"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleSidebar}
            className="mr-2"
          >
            {sidebarOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
          <h1 className="font-semibold text-xl">AI Chat</h1>
        </div>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
