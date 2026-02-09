import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverWidth, setPopoverWidth] = React.useState<number>(300);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (triggerRef.current && open) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
    // Reset search when popover closes
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Filter options based on search - show all when search is empty
  const filteredOptions = React.useMemo(() => {
    if (!search || search.trim() === '') {
      // Show all options when no search - allows scrolling and selecting
      return options;
    }
    
    // Filter when user types
    const searchLower = search.toLowerCase().trim();
    const normalizedSearch = searchLower.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    
    return options.filter(option => {
      const labelLower = option.label.toLowerCase();
      const valueLower = option.value.toLowerCase();
      const combinedText = `${labelLower} ${valueLower}`;
      const normalizedCombined = combinedText.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
      
      // Extract class code from label (format: "ACC 201 - Class Name" or "ECE 420 - Signals")
      const classCodeMatch = labelLower.match(/^([a-z]+)\s*(\d+)/i);
      if (classCodeMatch) {
        const classCodePrefix = classCodeMatch[1].toLowerCase();
        const classCodeNumber = classCodeMatch[2];
        const classCodeFull = `${classCodePrefix}${classCodeNumber}`;
        const classCodeWithSpace = `${classCodePrefix} ${classCodeNumber}`;
        
        // Match class code in various formats
        if (classCodePrefix.includes(searchLower) || searchLower.includes(classCodePrefix)) return true;
        if (classCodeFull.includes(normalizedSearch) || normalizedSearch.includes(classCodeFull)) return true;
        if (classCodeWithSpace.toLowerCase().includes(searchLower)) return true;
        if (classCodeNumber.includes(searchLower)) return true;
      }
      
      // Check if search matches anywhere in the label or value (case-insensitive)
      if (labelLower.includes(searchLower) || valueLower.includes(searchLower)) return true;
      
      // Check normalized matching (without spaces/special chars)
      if (normalizedCombined.includes(normalizedSearch)) return true;
      
      // Check if any word contains the search
      const words = combinedText.split(/\s+/);
      if (words.some(word => word.toLowerCase().includes(searchLower))) return true;
      
      // Check if search matches any part of any word
      const allChars = combinedText.replace(/\s+/g, '');
      if (allChars.includes(searchLower)) return true;
      
      return false;
    });
  }, [options, search]);

  // Find selected option with flexible matching (trim whitespace for comparison)
  const selectedOption = React.useMemo(() => {
    if (!value) return undefined;
    
    // Normalize function to handle whitespace and formatting differences
    const normalize = (str: string) => {
      return str.toLowerCase().trim().replace(/\s+/g, ' ').replace(/\s*-\s*/g, ' - ');
    };
    
    // Try exact match first
    let found = options.find((option) => option.value === value);
    if (found) {
      console.log('Combobox: Exact match', { value, found: found.label });
      return found;
    }
    
    // Try trimmed match (handle whitespace differences)
    found = options.find((option) => option.value.trim() === value.trim());
    if (found) {
      console.log('Combobox: Trimmed match', { value, found: found.label });
      return found;
    }
    
    // Try normalized match (handles class format like "ECE 420 - Signals")
    const normalizedValue = normalize(value);
    found = options.find((option) => normalize(option.value) === normalizedValue);
    if (found) {
      console.log('Combobox: Normalized match', { value, normalizedValue, found: found.label });
      return found;
    }
    
    // Try matching by parsing class code and name separately (for class format "CODE - Name")
    const valueMatch = value.match(/^(.+?)\s*-\s*(.+)$/);
    if (valueMatch) {
      const valueCode = valueMatch[1].trim();
      const valueName = valueMatch[2].trim();
      found = options.find((option) => {
        const optMatch = option.value.match(/^(.+?)\s*-\s*(.+)$/);
        if (optMatch) {
          const optCode = optMatch[1].trim();
          const optName = optMatch[2].trim();
          return optCode === valueCode && optName === valueName;
        }
        return false;
      });
      if (found) {
        console.log('Combobox: Parsed match', { value, valueCode, valueName, found: found.label });
        return found;
      }
    }
    
    // Last resort: case-insensitive match
    found = options.find((option) => option.value.toLowerCase().trim() === value.toLowerCase().trim());
    if (found) {
      console.log('Combobox: Case-insensitive match', { value, found: found.label });
    } else {
      console.warn('Combobox: No match found', { 
        value, 
        valueLength: value.length,
        optionsCount: options.length,
        sampleOptions: options.slice(0, 3).map(o => o.value)
      });
    }
    
    return found;
  }, [options, value]);
  
  // Create a map from label to value for quick lookup
  const labelToValueMap = React.useMemo(() => {
    const map = new Map<string, string>();
    options.forEach(option => {
      map.set(option.label, option.value);
    });
    return map;
  }, [options]);

  const handleSelect = React.useCallback((selectedLabel: string) => {
    // Find the option by label and get its value
    const optionValue = labelToValueMap.get(selectedLabel);
    if (optionValue !== undefined) {
      onValueChange(optionValue);
      setOpen(false);
    }
  }, [onValueChange, labelToValueMap]);
  
  const handleItemClick = React.useCallback((optionValue: string, optionLabel: string) => {
    onValueChange(optionValue);
    setOpen(false);
  }, [onValueChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          type="button"
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0" 
        align="start" 
        sideOffset={4}
        style={{ width: `${popoverWidth}px`, minWidth: "200px" }}
      >
        <Command shouldFilter={false} className="flex flex-col">
          <CommandList className="max-h-[400px] min-h-[200px] overflow-y-auto border-b">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    className="text-black aria-selected:text-black cursor-pointer pointer-events-auto"
                    style={{ pointerEvents: 'auto' }}
                    onSelect={() => {
                      // Use option.value from closure - this is the most reliable
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    onClick={(e) => {
                      // Backup click handler
                      e.stopPropagation();
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="text-black">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="border-t flex-shrink-0">
            <CommandInput 
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

