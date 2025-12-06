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

  React.useEffect(() => {
    if (triggerRef.current && open) {
      setPopoverWidth(triggerRef.current.offsetWidth);
    }
  }, [open]);

  // Find selected option with flexible matching (trim whitespace for comparison)
  const selectedOption = React.useMemo(() => {
    if (!value) return undefined;
    // Try exact match first
    let found = options.find((option) => option.value === value);
    if (found) {
      console.log('Combobox: Found exact match', { value, found: found.label });
      return found;
    }
    // Try trimmed match (handle whitespace differences)
    found = options.find((option) => option.value.trim() === value.trim());
    if (found) {
      console.log('Combobox: Found trimmed match', { value, found: found.label });
      return found;
    }
    // Try case-insensitive match
    found = options.find((option) => option.value.toLowerCase().trim() === value.toLowerCase().trim());
    if (found) {
      console.log('Combobox: Found case-insensitive match', { value, found: found.label });
    } else {
      console.log('Combobox: No match found', { value, availableOptions: options.map(o => o.value) });
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
        <Command 
          shouldFilter={true}
          filter={(value, search) => {
            if (!search) return 1;
            const searchLower = search.toLowerCase().trim();
            const valueLower = value.toLowerCase();
            
            // Find the option by label (value is the label in cmdk)
            const option = options.find(opt => opt.label === value);
            if (!option) return 0;
            
            // Search in both label and value
            const labelLower = option.label.toLowerCase();
            const optionValueLower = option.value.toLowerCase();
            const combinedText = `${labelLower} ${optionValueLower}`;
            
            // Extract class code from label (format: "ACC 201 - Class Name" or "ACC 201|Class Name")
            // Try to get the class code part (before dash or pipe, first word or two)
            const classCodeMatch = labelLower.match(/^([a-z]+\s*\d+)/i);
            const classCode = classCodeMatch ? classCodeMatch[1].toLowerCase().replace(/\s+/g, '') : '';
            const classCodeWithSpaces = classCodeMatch ? classCodeMatch[1].toLowerCase() : '';
            
            // Prioritize class code matches
            // Check if search matches the class code exactly or starts with it
            if (classCode && (classCode.startsWith(searchLower) || classCode.includes(searchLower))) {
              return 1;
            }
            if (classCodeWithSpaces && (classCodeWithSpaces.startsWith(searchLower) || classCodeWithSpaces.includes(searchLower))) {
              return 1;
            }
            
            // Check if search matches the beginning of label or value
            if (labelLower.startsWith(searchLower) || optionValueLower.startsWith(searchLower)) return 1;
            
            // Check if search matches anywhere in the combined text
            if (combinedText.includes(searchLower)) return 1;
            
            // Check if any word starts with the search
            const words = combinedText.split(/\s+/);
            if (words.some(word => word.startsWith(searchLower))) return 1;
            
            // For class codes, also check if search matches the beginning of any word (for codes like "ACC201")
            const allWordsNoSpaces = combinedText.replace(/\s+/g, ' ');
            if (allWordsNoSpaces.includes(searchLower)) return 1;
            
            return 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                // Build keywords array with partial matches for better search
                const labelLower = option.label.toLowerCase();
                const valueLower = option.value.toLowerCase();
                const allWords = `${option.label} ${option.value}`.toLowerCase().split(/\s+/);
                
                // Extract class code for classes (format: "ACC 201" or "ACCT 301")
                // Try to extract the code part (letters + numbers)
                const classCodeMatch = labelLower.match(/^([a-z]+)\s*(\d+)/i);
                let classCodePrefix = '';
                let classCodeFull = '';
                if (classCodeMatch) {
                  classCodePrefix = classCodeMatch[1].toLowerCase(); // "acc" or "acct"
                  classCodeFull = `${classCodeMatch[1].toLowerCase()}${classCodeMatch[2]}`; // "acc201"
                }
                
                const keywords: string[] = [labelLower, valueLower];
                
                // Add class code keywords if this looks like a class
                if (classCodePrefix) {
                  keywords.push(classCodePrefix);
                  if (classCodePrefix.length >= 3) keywords.push(classCodePrefix.substring(0, 3));
                  if (classCodePrefix.length >= 4) keywords.push(classCodePrefix.substring(0, 4));
                  if (classCodeFull) keywords.push(classCodeFull);
                }
                
                // Add partial word matches
                allWords.forEach(word => {
                  if (word.length >= 3) keywords.push(word.substring(0, 3));
                  if (word.length >= 4) keywords.push(word.substring(0, 4));
                  if (word.length >= 5) keywords.push(word.substring(0, 5));
                });
                
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    keywords={keywords}
                    onSelect={(currentValue) => {
                      // cmdk's onSelect receives the value prop (label)
                      // Always use option.value from closure to ensure correct value
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
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

