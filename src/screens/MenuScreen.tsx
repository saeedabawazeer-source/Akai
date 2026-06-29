// @ts-nocheck
import React from 'react';

interface MenuItem {
  label: string;
  value?: string;
  icon?: string;
}

interface MenuScreenProps {
  title: string; // Used internally or for specific rendering
  items: MenuItem[];
  selectedIndex: number;
  rightActionText?: string;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ title, items, selectedIndex, rightActionText }) => {
  return (
    <div className="w-full h-full bg-[#151515] font-mono text-white flex flex-col">
      {/* Top Bar matching B1, B2, B3 */}
      <div className="flex justify-between items-center px-2 py-0.5 border-b border-[#2a2a2a] mb-1">
        <div className="text-[8px] text-white">{'< Back'}</div>
        <div className="text-[8px] text-gray-400 px-1"></div>
        {rightActionText ? (
          <div className="text-[8px] bg-white text-black font-bold px-1">{rightActionText}</div>
        ) : (
          <div className="text-[8px] text-gray-400 px-1"></div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-2 overflow-hidden gap-[1px]">
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-between px-1 text-[8px] ${
                isSelected ? 'bg-gray-700 text-white' : 'text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[7px] w-2 flex justify-center">{item.icon || '⋮'}</span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.value && (
                <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                  {item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuScreen;
