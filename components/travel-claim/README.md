# Travel Claim Components

## 📦 Installation Required

Before using ReceiptUploader, install expo-image-picker:

```bash
npx expo install expo-image-picker
```

## 🎨 Components

### 1. ReceiptUploader

Handles photo capture and selection for expense receipts.

**Features:**
- Camera capture with permission handling
- Gallery photo selection
- Thumbnail preview with replace/remove
- Compressed images (70% quality) to reduce storage
- Dark mode support
- Accessibility labels

**Usage:**

```tsx
import { ReceiptUploader } from '@/components/travel-claim/ReceiptUploader';

function MyExpenseForm() {
  const [receiptUri, setReceiptUri] = useState('');

  return (
    <ReceiptUploader
      onPhotoSelected={setReceiptUri}
      existingUri={receiptUri}
      label="Receipt Photo"
    />
  );
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onPhotoSelected` | `(uri: string) => void` | ✅ | Callback when photo is selected/removed |
| `existingUri` | `string` | ❌ | URI of existing photo to display |
| `label` | `string` | ❌ | Label text (default: "Receipt Photo") |

---

### 2. ExpenseCard

Reusable collapsible wrapper for expense entries.

**Features:**
- Collapsible with smooth opacity animation
- Delete confirmation dialog
- Customizable header with icon
- Optional header right content
- Generic type support
- Auto-displays amount if present
- Dark mode support

**Usage:**

```tsx
import { ExpenseCard, BaseExpense } from '@/components/travel-claim/ExpenseCard';
import { Fuel } from 'lucide-react-native';

interface FuelExpense extends BaseExpense {
  location: string;
  gallons: number;
}

function FuelExpenseList() {
  const [expense, setExpense] = useState<FuelExpense>({
    id: '1',
    amount: 45.50,
    location: 'San Diego, CA',
    gallons: 12.5,
  });

  return (
    <ExpenseCard
      expense={expense}
      onUpdate={(patch) => setExpense({ ...expense, ...patch })}
      onDelete={() => deleteExpense(expense.id)}
      title={expense.location || 'New Fuel Entry'}
      icon={<Fuel size={18} color="#2563eb" />}
      isCollapsible={true}
      defaultExpanded={false}
    >
      <TextInput
        placeholder="Location"
        value={expense.location}
        onChangeText={(location) => setExpense({ ...expense, location })}
      />
      <TextInput
        placeholder="Gallons"
        value={String(expense.gallons)}
        onChangeText={(gallons) => setExpense({ ...expense, gallons: Number(gallons) })}
      />
    </ExpenseCard>
  );
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `expense` | `T extends BaseExpense` | ✅ | Expense data (must have `id`) |
| `onUpdate` | `(patch: Partial<T>) => void` | ✅ | Update callback |
| `onDelete` | `() => void` | ✅ | Delete callback (shows confirmation) |
| `title` | `string` | ✅ | Card header title |
| `icon` | `React.ReactNode` | ✅ | Icon component (Lucide) |
| `children` | `React.ReactNode` | ✅ | Form fields/content |
| `headerRight` | `React.ReactNode` | ❌ | Custom header right content |
| `isCollapsible` | `boolean` | ❌ | Enable collapse (default: `true`) |
| `defaultExpanded` | `boolean` | ❌ | Start expanded (default: `false`) |

**SimpleExpenseCard Variant:**
For non-collapsible cards, use `SimpleExpenseCard`:

```tsx
import { SimpleExpenseCard } from '@/components/travel-claim/ExpenseCard';

<SimpleExpenseCard
  expense={expense}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  title="Parking Fee"
  icon={<ParkingCircle size={18} color="#2563eb" />}
>
  {/* Always visible content */}
</SimpleExpenseCard>
```

---

## 🔗 Integration with Existing Components

### Update TravelStep2Lodging.tsx

Replace inline receipt handling with ReceiptUploader:

```tsx
import { ReceiptUploader } from '@/components/travel-claim/ReceiptUploader';

// Inside LodgingExpenseCard expanded section:
<ReceiptUploader
  onPhotoSelected={(uri) => onUpdate({ receiptUri: uri })}
  existingUri={expense.receiptUri}
/>
```

### Use ExpenseCard for Fuel/Toll/Parking

```tsx
import { ExpenseCard } from '@/components/travel-claim/ExpenseCard';

<ExpenseCard
  expense={fuelExpense}
  onUpdate={(patch) => updateFuelExpense(fuelExpense.id, patch)}
  onDelete={() => removeFuelExpense(fuelExpense.id)}
  title={fuelExpense.location || 'New Fuel Entry'}
  icon={<Fuel size={18} color="#2563eb" />}
>
  <TextInput placeholder="Location (e.g., San Diego, CA)" ... />
  <TextInput placeholder="Gallons" keyboardType="decimal-pad" ... />
  <TextInput placeholder="Price per gallon" keyboardType="decimal-pad" ... />
  <ReceiptUploader
    onPhotoSelected={(uri) => updateFuelExpense(fuelExpense.id, { receiptUri: uri })}
    existingUri={fuelExpense.receiptUri}
  />
</ExpenseCard>
```

---

## 🎨 Styling

Both components follow the My Compass design system:

- **Colors:** Navy theme (slate-900, blue-600, amber-600)
- **Styling:** NativeWind (Tailwind CSS)
- **Icons:** Lucide React Native
- **Animations:** Reanimated 4
- **Dark Mode:** Full support with `dark:` variants

---

## 🧪 Testing

After installing expo-image-picker, test on a physical device (camera won't work in simulator):

1. **Camera Test:**
   - Tap "Take Photo"
   - Grant camera permissions
   - Take photo → should show thumbnail

2. **Gallery Test:**
   - Tap "Choose Photo"
   - Select photo → should show thumbnail

3. **Replace Test:**
   - With existing photo, tap "Retake" or "Replace"
   - Should update thumbnail

4. **Delete Test:**
   - Tap X button on thumbnail
   - Confirm deletion → should clear photo

5. **Collapse Test (ExpenseCard):**
   - Tap card header → should animate opacity
   - Tap delete → should show confirmation alert

---

## 📝 Type Safety

Both components are fully typed:

```typescript
// ExpenseCard is generic - supports any expense type
interface CustomExpense extends BaseExpense {
  customField: string;
}

<ExpenseCard<CustomExpense>
  expense={myExpense}
  onUpdate={(patch) => {
    // TypeScript knows patch is Partial<CustomExpense>
  }}
  ...
/>
```

---

## 🚀 Next Steps

1. Install expo-image-picker: `npx expo install expo-image-picker`
2. Replace inline receipt handling in TravelStep2Lodging.tsx
3. Use ExpenseCard for Steps 3 & 4 (Fuel, Tolls, Parking, Misc)
4. Test on physical device for camera functionality
