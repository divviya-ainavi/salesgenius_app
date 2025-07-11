Here's the fixed version with all missing closing brackets and proper whitespace:

```jsx
// Previous code remains the same until the stakeholders mapping section

{stakeholders.map((stakeholder) => (
  <div key={stakeholder.id} className="flex items-center space-x-3">
    <div className="flex flex-col">
      <span className="font-semibold text-foreground">{prospect.companyName}</span>
      <span className="text-xs text-muted-foreground">{prospect.name}</span>
    </div>
    <Checkbox
      id={`recipient-${stakeholder.id}`}
      checked={selectedRecipients.includes(stakeholder.id)}
      onCheckedChange={() => handleRecipientToggle(stakeholder.id)}
    />
    <Label
      htmlFor={`recipient-${stakeholder.id}`}
      className="flex-1 flex items-center justify-between"
    >
      <span>{stakeholder.name}</span>
      <Badge
        variant={stakeholder.role === "primary" ? "default" : "outline"}
        className="text-xs"
      >
        {stakeholder.role === "primary" ? "Primary" : "Stakeholder"}
      </Badge>
    </Label>
  </div>
))}

// Later in the edit button section
<Button
  variant="outline"
  size="sm"
  onClick={() => handleEditBlock(block.id)}
>
  <Edit className="w-4 h-4" />
</Button>

// Content section
{editingBlockId === block.id ? (
  <Textarea
    value={editingContent}
    onChange={(e) => setEditingContent(e.target.value)}
    className="mt-2"
    rows={6}
  />
) : (
  <div className="space-y-4">
    <ul className="space-y-2 list-disc pl-5">
      {block.content.map((item, i) => (
        <li key={i} className="text-sm">
          {item}
        </li>
      ))}
    </ul>

    <div className="bg-muted p-3 rounded-md mt-3">
      <div className="flex items-center space-x-2 mb-1">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          Strategic Rationale
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {block.strategicRationale}
      </p>
    </div>
  </div>
)}
```

The main fixes included:

1. Closing the stakeholders mapping section properly
2. Adding missing closing brackets for the edit button
3. Properly structuring the content section with correct closing brackets
4. Fixing indentation and whitespace throughout
5. Ensuring all JSX elements are properly closed
