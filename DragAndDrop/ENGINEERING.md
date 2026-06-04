# Drag & Drop Question Types — Engineering Reference

A technical companion to the [content-author guide](./index.html). This document maps each
drag-and-drop `questionType` to the code that implements it and includes the example JSON used
on the website.

All code paths are relative to the repo root (`khan_kids_code/`). Line numbers are accurate as
of this writing; treat them as starting points and grep the symbol if they drift.

---

## Architecture overview

### Page routing

A question's `questionType` string is mapped to a concrete page class in `LeafPage.cpp`:

- `kkids/KinBoxK/Classes/Pages/LeafPages/LeafPage.cpp`
  - `getLeafChildPageType()` (~line 1273): any type beginning with `DD` is routed by suffix —
    types **ending in `Boxes`** go to `QUESTION_DDBOXES_LAYOUT_PAGE`, everything else `DD*` goes
    to `QUESTION_DD_LAYOUT_PAGE`.

    ```cpp
    else if (MFStringUtils::beginsWith(questionType, "DD"))
    {
       return MFStringUtils::endsWith(questionType, "Boxes")
          ? QUESTION_DDBOXES_LAYOUT_PAGE : QUESTION_DD_LAYOUT_PAGE;
    }
    ```
  - `createLeafChildPage()` (~line 1320): instantiates `LeafQuestionDDLayoutPage` or
    `LeafQuestionDDBoxesLayoutPage`.

So there are **two implementing page classes**, one per family:

| Family | Question types | Page class | File |
|--------|----------------|------------|------|
| 1 · Slot-Based | `DDXintoA`, `DDXYintoAB`, `DD1SlotPerItem`, `DDAnySlot` | `LeafQuestionDDLayoutPage` | `.../LeafPages/LeafQuestionDDLayoutPage.cpp` |
| 2 · Boxes | `DDBoxes`, `DDFillBoxes`, `DDAnyBoxes`, `DDLetterBoxes`, `DDSoundBoxes` | `LeafQuestionDDBoxesLayoutPage` | `.../LeafPages/LeafQuestionDDBoxesLayoutPage.cpp` |

Both extend the shared base `LeafQuestionLayoutPage`
(`.../LeafPages/LeafQuestionLayoutPage.cpp`), which owns common item/slot setup, the
`itemsInOrder` parameter handling (`itemsInOrder()` ~line 2009), and feedback (`Kodi` yay/oops).

### Type validation

- `kkids/KinBoxK/Classes/FileCache/ContentMgr/ContentQuestion.cpp`
  - `isValid()` (~line 1011) holds the allow-list of every valid `questionType`, including
    `DDLetterBoxes`, `DDSoundBoxes`, `DDBoxes`, `DDFillBoxes`, `DDAnyBoxes`, `DDXintoA`,
    `DDXYintoAB`, `DD1SlotPerItem`, `DDAnySlot`.

---

# Family 1 · Slot-Based drags

**Implementation:** `kkids/KinBoxK/Classes/Pages/LeafPages/LeafQuestionDDLayoutPage.cpp`

Key shared logic:

- `getSlots()` (~line 94) and `onValidAndBogusItems()` (~line 140) build drop slots/items.
  `DDXintoA` / `DDXYintoAB` get special grouping at lines **129** and **147**.
- `getDropSlot()` (~line 156) resolves which drop slot a `Valid` item's `slot` maps to.
- `onTouchEnd()` (~line 352) is the drop handler. The acceptance test (lines **373–388**)
  decides whether a dropped item sticks:

  ```cpp
  if ((m_dragItem->getPropInt(kPropDropSlot) > 0 || acceptInvalid) &&
      !slot->getPropInt(kPropIsDone) &&
      CanvasHelper::viewsIntersect(m_dragItem, slot) &&
      (slot->getPropInt(kPropDropSlot) == m_dragItem->getPropInt(kPropDropSlot) ||
       acceptInvalid ||
       m_question->questionType == "DDAnySlot" ||
       (m_question->questionType == "DD1SlotPerItem" && checkOtherDropSlots(slot, m_dragItem))))
  ```
  - `DDAnySlot` → any valid item accepted by any slot.
  - `DD1SlotPerItem` → accepted if the slot is in the item's allowed set (`checkOtherDropSlots()`, ~line 591).
  - Otherwise (`DDXintoA` / `DDXYintoAB`) → the item's `kPropDropSlot` must equal the slot's.
- Completion: the page counts placed valid items (`m_count`) and fires `questionDoneKodiYay()`
  when `m_count == getNumTarget()` (~lines 455–457). This is the "checks on drop" behavior that
  distinguishes Family 1 from the submit-button Boxes family.

---

## DDXintoA

**One accepted drop slot group.** The child drags the required number of `Valid` items into a
single accepted slot group; `Bogus` drops fire `Oops`. With `showSubmitButton: false` it checks
on drop.

- Distinguisher in code: falls to the default branch of the `onTouchEnd()` acceptance test —
  the dropped item's `kPropDropSlot` must match the slot's. Grouped at
  `LeafQuestionDDLayoutPage.cpp:129,147`.

### 1.1 — Several drop slots, only one accepts the Valid item

`ATL09FlexibleThinking_EN.asm.leaf.json` (312–356):

```json
{
  "childType": "Question",
  "name": "ATL9V2-EN-p01-L1",
  "questionType": "DDXintoA",
  "numTotalItems": 1,
  "numValidItems": 1,
  "layout": "test/pp/assessments/DimensionalCardSortDDXintoA2Stat",
  "comments": "practice: purple train",
  "items": [
    { "itemType": "Background", "path": "...dimensionalcardsortbackgroundemptytables.png" },
    { "itemType": "Static", "path": ".../OrangeTrainRoundCorners.png", "slot": "stat1" },
    { "itemType": "Static", "path": ".../PurpleFishRoundCorners.png", "slot": "stat2" },
    { "itemType": "Valid",  "path": ".../PurpleTrainRoundCorners.png", "slot": "drop2" },
    { "itemType": "Instruction", "text": "Color", "path": "USGK:Labs11/K002/Color" },
    { "itemType": "Yay",  "text": "Thats right!", "path": "..." },
    { "itemType": "Oops", "text": "Oops. This one is purple. Put it with the other purple one.", "path": "..." }
  ]
}
```

`MAT10Positions_EN.asm.leaf.json` (583–623):

```json
{
  "childType": "Question",
  "name": "MAT10V2-EN-q13-KG",
  "questionType": "DDXintoA",
  "layout": "test/ia/Gates2025/MAT10/MAT10table",
  "numTotalItems": 1,
  "numValidItems": 1,
  "dropSlotStyle": "DashBorder",
  "disable": "oops,multiTries,sparkles,thisIsHow,exuberantKodi",
  "comments": "ask: drag Peck TOP",
  "items": [
    { "itemType": "Instruction", "text": "Put Peck on top of the table", "block": "90", "path": "..." },
    { "itemType": "Valid", "path": ".../birdChar.png", "slot": "drop2",
      "behavior": "tapFlips1", "audioPath": ".../Character:peckintro2", "scale": "110" },
    { "itemType": "Drop", "slot": "drop2" },
    { "itemType": "Yay", "text": "Lets do another one!", "path": "..." },
    { "itemType": "Background", "path": ".../MAT10Table.png" }
  ]
}
```

### 1.2 — Several items, one Valid item, one drop slot

`LAN07aWordCategories_EN.asm.leaf.json` (64–150):

```json
{
  "name": "LAN7aV2-EN-p01-L2YO",
  "questionType": "DDXintoA",
  "layout": ".../LAN/DDXintoA4CharBoxStatLeft",
  "showSubmitButton": false,
  "numTotalItems": 4,
  "numValidItems": 1,
  "disable": "enableNameItems",
  "comments": "ask: not like the others - apple",
  "items": [
    { "itemType": "Instruction", "text": "One of these things is not like the others. Give it to Ollo." },
    { "itemType": "Valid", "itemSlot": "4", "audioPathText": "Apple", "path": ".../food1.png" },
    { "itemType": "Bogus", "itemSlot": "3", "audioPathText": "Duck", "path": ".../ollotub1.png" },
    { "itemType": "Bogus", "itemSlot": "2", "audioPathText": "Duck", "path": ".../ollotub1.png" },
    { "itemType": "Bogus", "itemSlot": "1", "audioPathText": "Duck", "path": ".../ollotub1.png" },
    { "itemType": "Static", "slot": "stat1", "path": ".../OpenBox1.png" },
    { "itemType": "Static", "slot": "drop1", "path": ".../elephantChar.png" },
    { "itemType": "Drop", "slot": "drop1", "y": "85", "x": "50", "scale": "30" },
    { "itemType": "Yay",  "text": "Thats right! An apple is not a duck..." },
    { "itemType": "Oops", "text": "Hmm thats a duck. The thing thats different is an apple. Try again!" }
  ]
}
```

`LIT01aRhyming_EN.asm.leaf.json` (757–844) — rhymes with STAR:

```json
{
  "name": "LIT1aV3-EN-q10-4YO",
  "questionType": "DDXintoA",
  "layout": ".../LIT1a/DD1SlotPerItem1Stat1Drop4Items",
  "numTotalItems": 4,
  "numValidItems": 1,
  "var1": "star", "var2": "dice", "var3": "tire", "var4": "soap", "var5": "car",
  "soundExt": "_word",
  "dropSlotStyle": "DashBorder #light",
  "comments": "ask: which word rhymes with STAR? [4 ans choices]",
  "items": [
    { "itemType": "Background", "path": ".../stargazing.png" },
    { "itemType": "Valid", "path": ".../Words:{var5}", "itemSlot": "4", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../Words:{var2}", "itemSlot": "1", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../Words:{var3}", "itemSlot": "2", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../Words:{var4}", "itemSlot": "3", "behavior": "wiggle1" },
    { "itemType": "Static", "path": ".../Words:{var1}", "slot": "stat1" },
    { "itemType": "Drop", "slot": "drop1" },
    { "itemType": "Instruction", "text": "Which word rhymes with STAR? Drag it to the top." },
    { "itemType": "Yay",  "text": "Lets do another one!" },
    { "itemType": "Oops", "text": "Lets do another one!" }
  ]
}
```

`LIT01bBlending_EN.asm.leaf.json` (71–146) — blend h-ug:

```json
{
  "name": "LIT1bV4-EN-q01-4YO",
  "questionType": "DDXintoA",
  "layout": ".../LIT1b/DDXintoA3MagicHat",
  "disable": "oops,multiTries,sparkles,exuberantKodi,enableNameItems",
  "numTotalItems": 3,
  "numValidItems": 1,
  "var1": "fish", "var2": "car", "var3": "hug",
  "soundExt": "_word",
  "comments": "ask: h-ug",
  "items": [
    { "itemType": "Bogus", "path": ".../Words/{var1}.png", "audioPathText": "Fish", "itemSlot": "1" },
    { "itemType": "Bogus", "path": ".../Words/{var2}.png", "audioPathText": "Car",  "itemSlot": "2" },
    { "itemType": "Valid", "path": ".../Words/{var3}.png", "audioPathText": "Hug",  "itemSlot": "3" },
    { "itemType": "Static", "path": ".../magichat.png", "slot": "drop1" },
    { "itemType": "Drop", "slot": "drop1", "scale": "55%", "y": "2%" },
    { "itemType": "Instruction", "text": "HPhonics UgPhonics. Put it in my magic hat" },
    { "itemType": "Background", "path": ".../whitebg.png" }
  ]
}
```

### 1.3 — Several items, more than one Valid item, one drop slot

`LAN07bSharedCharacteristics_EN.asm.leaf.json` (211–290):

```json
{
  "name": "LAN7bV2-EN-p01-L2YO",
  "questionType": "DDXintoA",
  "layout": ".../LAN/DDXintoA4CharFlipBoxStatLeft",
  "showSubmitButton": false,
  "numTotalItems": 4,
  "numValidItems": 3,
  "comments": "ask: fruit",
  "items": [
    { "itemType": "Drop", "slot": "drop1", "scale": "30" },
    { "itemType": "Instruction", "text": "Which of these things are fruit. Drag them to the box." },
    { "itemType": "Valid", "itemSlot": "1", "slot": "drop1", "path": ".../strawberry.png" },
    { "itemType": "Valid", "itemSlot": "2", "slot": "drop1", "path": ".../orange.png" },
    { "itemType": "Valid", "itemSlot": "3", "slot": "drop1", "path": ".../grapes.png" },
    { "itemType": "Bogus", "itemSlot": "4", "path": ".../bike.png" },
    { "itemType": "Static", "slot": "stat1", "path": ".../OpenBox1.png" },
    { "itemType": "Static", "slot": "stat2", "path": ".../fruit.png" },
    { "itemType": "Yay",  "text": "Way to go! You dragged only the fruit..." },
    { "itemType": "Oops", "text": "Remember drag only the things that follow the rule!" }
  ]
}
```

`LIT01aRhyming_EN.asm.leaf.json` (1449–1532) — two words rhyme with LOCK:

```json
{
  "name": "LIT1aV3-EN-q18-KG",
  "questionType": "DDXintoA",
  "layout": ".../LIT1a/DD1SlotPerItem1Stat1Drop4ItemsV2",
  "numTotalItems": 4,
  "numValidItems": 2,
  "var1": "lock", "var2": "lamp", "var3": "clock", "var4": "doll", "var5": "sock",
  "soundExt": "_word",
  "comments": "ask: which words rhyme with LOCK? [2 valid, 4 ans choices]",
  "items": [
    { "itemType": "Static", "path": ".../Words:{var1}", "slot": "stat1" },
    { "itemType": "Valid", "path": ".../Words:{var3}", "itemSlot": "2", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../Words:{var2}", "itemSlot": "1", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../Words:{var4}", "itemSlot": "3", "behavior": "wiggle1" },
    { "itemType": "Valid", "path": ".../Words:{var5}", "itemSlot": "4", "behavior": "wiggle1" },
    { "itemType": "Background", "path": ".../blueprintdrop.png" },
    { "itemType": "Drop", "slot": "drop1", "scale": "30" },
    { "itemType": "Instruction", "text": "Which two words rhyme with LOCK?" },
    { "itemType": "Yay",  "text": "Thanks for playing with me!" },
    { "itemType": "Oops", "text": "Thanks for playing with me!" }
  ]
}
```

### 1.4 — One drop slot, drag a set number of items (Fishbowl)

`MAT03Count1By1_EN.asm.leaf.json` (61–113). Uses `behaviorStyle: "Fishbowl"` and a green submit button (count-based answer):

```json
{
  "name": "MAT3V2-EN-p01-2YO",
  "questionType": "DDXintoA",
  "behaviorStyle": "Fishbowl",
  "layout": "behaviorStyles/Fishbowl/ddnintoa4_layout",
  "numValidItems": 1,
  "numTotalItems": 3,
  "numExtraItems": 2,
  "comments": "ask: 1 of 3 toys in bowl",
  "items": [
    { "itemType": "Valid", "path": ".../ollotoys:ollotub26" },
    { "itemType": "Custom", "path": ".../fishbowl1.png", "slot": "drop1", "params": "waterColor=48B6CE" },
    { "itemType": "Background", "path": ".../default_bg.png" },
    { "itemType": "Instruction", "text": "Put one toy in the bowl. ...Then press the green button..." },
    { "itemType": "Yay",  "text": "Yay! You dragged one toy to the bowl..." },
    { "itemType": "Oops", "text": "Make sure only one toy is in the bowl." },
    { "itemType": "ThisIsHow", "text": "This is how you drag one toy to the bowl." }
  ]
}
```

---

## DDXYintoAB

**Two accepted drop slot groups** (`drop1` / `drop2`). Each `Valid` item is tagged `"slot": "1"`
or `"slot": "2"`; `Bogus` belongs to neither.

- Distinguisher in code: grouped alongside `DDXintoA` at `LeafQuestionDDLayoutPage.cpp:129,147`,
  but builds two accepted groups. Acceptance uses the default `kPropDropSlot`-match branch in
  `onTouchEnd()`.

### 2.1 — Sort two groups, each into its own drop slot

`A4_APL_APLe_EAR_02.leaf.json` (6–76):

```json
{
  "name": "q1a",
  "questionType": "DDXYintoAB",
  "layout": "USGK/CommonLayouts/Drag/DD1SlotPerItem2STall",
  "numValidItems": 2,
  "numTotalItems": 2,
  "comments": "big with big - hat",
  "soundExt": "_silent",
  "items": [
    { "itemType": "Valid", "path": ".../hat.png", "slot": "1", "scale": "150%" },
    { "itemType": "Valid", "path": ".../hat.png", "slot": "2", "scale": "80%" },
    { "itemType": "Static", "path": ".../orangutan.png", "slot": "drop1", "scale": "100%" },
    { "itemType": "Drop",   "slot": "drop1", "x": "49%", "y": "42%", "scale": "55%" },
    { "itemType": "Static", "path": ".../orangutan.png", "slot": "drop2", "scale": "55%" },
    { "itemType": "Drop",   "slot": "drop2", "x": "49%", "y": "74%", "scale": "30%" },
    { "itemType": "Background", "path": ".../earthdayjungle.png" },
    { "itemType": "Instruction", "text": "Put the big hat on the big orangutan. Put the small hat on the small orangutan." },
    { "itemType": "Yay", "text": "outstanding orangutan! Now lets do something silly." }
  ]
}
```

`A3_APL_APLe_EAR_04.leaf.json` (55–109) — Fishbowl color sort:

```json
{
  "name": "q2",
  "questionType": "DDXYintoAB",
  "behaviorStyle": "Fishbowl",
  "layout": "behaviorStyles/Fishbowl/layout",
  "numValidItems": 6,
  "numTotalItems": 6,
  "soundExt": "_silent",
  "comments": "brown in green, green in brown",
  "items": [
    { "itemType": "Valid",  "path": ".../Words:monkey,cockroach,beaver,weasel", "slot": "2" },
    { "itemType": "Custom", "path": ".../fishbowl1.png", "params": "waterColor=D0AB8B,waterLevel=50%", "slot": "drop1" },
    { "itemType": "Valid",  "path": ".../Words:chameleon,leaf,pear,frog", "slot": "1" },
    { "itemType": "Custom", "path": ".../fishbowl1.png", "params": "waterColor=5A9F4B,waterLevel=50%", "slot": "drop2" },
    { "itemType": "Background", "path": ".../earthdayflowerfield.png" },
    { "itemType": "Instruction", "text": "Put the brown things in the green water. Put the green things in the brown water." },
    { "itemType": "Oops", "text": "Oops! This is a tricky one. Listen carefully." },
    { "itemType": "Yay",  "text": "great job! lets do it again." }
  ]
}
```

`Drag-All.leaf.json` (206–260) — ToyBox pronoun sort (two drawers):

```json
{
  "name": "q5",
  "questionType": "DDXYintoAB",
  "behaviorStyle": "ToyBox",
  "numValidItems": 8,
  "numTotalItems": 8,
  "soundExt": "_word",
  "comments": "DDXYintoAB; 2 Drawers with text labels",
  "items": [
    { "itemType": "Valid", "path": ".../people:boy1,boy2,boy3,man1,man2,man3,grandpa1,grandpa2,grandpa3" },
    { "itemType": "Valid", "path": ".../people:girl1,girl2,girl3,woman1,woman2,woman3,grandma1,grandma2,grandma3" },
    { "itemType": "Bogus", "path": ".../people:people1,people2,people3" },
    { "itemType": "Instruction", "text": "Sort the people by the pronoun he or she.", "block": "0%" },
    { "itemType": "Yay", "text": "You sorted them." },
    { "itemType": "Background", "path": ".../patternbg10.png" },
    { "itemType": "Custom", "path": "behaviorStyles/Toybox/drawerorange.png" },
    { "itemType": "Static", "text": "He",  "audioPath": ".../Words:He_word",  "slot": "drop1" },
    { "itemType": "Static", "text": "She", "audioPath": ".../Words:She_word", "slot": "drop2" }
  ]
}
```

### 2.2 — Valid items into two drop slots, with Bogus distractors

`A5_LSW_LSWe_EAR_05_SortLetters.leaf.json` (68–132):

```json
{
  "name": "q2",
  "questionType": "DDXYintoAB",
  "layout": "USGK/CommonLayouts/Drag/DDXYintoAB",
  "numValidItems": 6,
  "numTotalItems": 10,
  "soundExt": "_phonics",
  "comments": "p to polar bear. d to deer",
  "items": [
    { "itemType": "Valid", "text": "p", "slot": "1", "textColor": "645B83", "scale": "90%" },
    { "itemType": "Valid", "text": "d", "slot": "2", "textColor": "645B83", "scale": "90%" },
    { "itemType": "Bogus", "text": "a,m,j,b,c,s,x,i,l", "textColor": "645B83", "scale": "90%" },
    { "itemType": "Background", "path": ".../earthdaytundra.png" },
    { "itemType": "Static", "text": "p", "slot": "drop1", "bgPath": ".../polarbear.png",
      "audioPath": ".../polarbear_word.mp3", "params": "bgScale=85%" },
    { "itemType": "Static", "text": "d", "slot": "drop2", "bgPath": ".../deer.png",
      "audioPath": ".../deer_word.mp3" },
    { "itemType": "Instruction", "text": "Drag the letter P to the polar bear. Drag the letter D to the deer." }
  ]
}
```

---

## DD1SlotPerItem

**One item per drop slot, matched.** Each drop slot holds exactly one item; each `Valid` item is
tagged with its accepted slot number(s) (`"1"` or `"2,3"`). With a single slot it is
indistinguishable from `DDXintoA`.

- Distinguisher in code: `LeafQuestionDDLayoutPage.cpp` `onTouchEnd()` lines **378–388** and
  **623–624** — acceptance requires `checkOtherDropSlots(slot, item)` (the slot is in the item's
  allowed set), and the slot is marked done after a single item (`kPropIsDone` at line 385–388).

### 3.1 — One valid drop slot per item

`Drag_Match2Sets_16Var.leaf.json` (5–121):

```json
{
  "name": "q1",
  "questionType": "DD1SlotPerItem",
  "layout": ".../Drag/DDXinto4StatinDropFlip",
  "numTotalItems": 4,
  "numValidItems": 4,
  "soundExt": "_phonics",
  "comments": "uppercase and lowercase, 4 items; egg and pan",
  "items": [
    { "itemType": "Valid", "text": "A", "slot": "1", "bgPath": ".../egg.png" },
    { "itemType": "Valid", "text": "B", "slot": "2", "bgPath": ".../egg.png" },
    { "itemType": "Valid", "text": "C", "slot": "3", "bgPath": ".../egg.png" },
    { "itemType": "Valid", "text": "D", "slot": "4", "bgPath": ".../egg.png" },
    { "itemType": "Static", "slot": "drop1,drop2,drop3,drop4", "path": ".../pan.png" },
    { "itemType": "Static", "slot": "stat1", "text": "a" },
    { "itemType": "Static", "slot": "stat2", "text": "b" },
    { "itemType": "Static", "slot": "stat3", "text": "c" },
    { "itemType": "Static", "slot": "stat4", "text": "d" },
    { "itemType": "Drop", "slot": "drop1,drop2,drop3,drop4" },
    { "itemType": "Background", "path": ".../patternbg1.png" },
    { "itemType": "Instruction", "text": "Fry each egg on a pan. Match the uppercase and lowercase letters" },
    { "itemType": "Yay", "text": "You matched the upper and lowercase letters!" }
  ]
}
```

### 3.2 — Several identical items into interchangeable drop slots

`Drag-All.leaf.json` (4–51). One `Valid` line with a comma-slot list (`"1,2,3,4"`) spawns one copy per slot:

```json
{
  "name": "q1",
  "questionType": "DD1SlotPerItem",
  "numValidItems": 4,
  "soundExt": "_silent",
  "layout": ".../Drag/DD8Slot4Item1PostA",
  "comments": "DD1SlotPerItem",
  "items": [
    { "itemType": "Instruction", "text": "drag 4 toys to the top squares" },
    { "itemType": "Valid", "path": ".../ollotub1.png", "slot": "1,2,3,4", "behavior": "wiggle1" },
    { "itemType": "Post", "behavior": "count" },
    { "itemType": "Background", "path": ".../patternbg1.png" },
    { "itemType": "Static", "path": ".../squarestatic11.png", "slot": "drop1,drop2,drop3,drop4" },
    { "itemType": "Static", "path": ".../squarestatic3.png",  "slot": "drop5,drop6,drop7,drop8" },
    { "itemType": "Drop", "slot": "drop1,drop2,drop3,drop4", "scale": "85%" }
  ]
}
```

### 3.3 — Different items, each valid in its own set of drop slots

`Drag_Math.leaf.json` (145–212):

```json
{
  "name": "q4",
  "questionType": "DD1SlotPerItem",
  "layout": ".../Drag/DD1SlotperItem3Slots3Stat",
  "numTotalItems": 3,
  "numValidItems": 3,
  "var1": "moose", "var2": "duck",
  "comments": "Complete the rest of the pattern ABBABB",
  "dropSlotStyle": "DashBorder #light",
  "items": [
    { "itemType": "Instruction", "text": "Based on the pattern, what comes next?" },
    { "itemType": "Background", "path": ".../patternbg8.png" },
    { "itemType": "Static", "path": ".../{var1}.png", "slot": "stat1" },
    { "itemType": "Static", "path": ".../{var2}.png", "slot": "stat2,stat3" },
    { "itemType": "Valid",  "path": ".../{var1}.png", "slot": "1" },
    { "itemType": "Valid",  "path": ".../{var2}.png", "slot": "2,3" }
  ]
}
```

### 3.4 — Only some of the drop slots are valid (measuring)

`A5_MAT_MAT4_MAD_01_a.easy.leaf.json` (59–114):

```json
{
  "name": "q2",
  "questionType": "DD1SlotPerItem",
  "layout": ".../Drag/measurevertically",
  "numTotalItems": 3,
  "numValidItems": 3,
  "dropSlotStyle": "DashBorder",
  "soundExt": "_silent",
  "comments": "drag turtles to height of sandy",
  "items": [
    { "itemType": "Background", "path": ".../patternbg9.png" },
    { "itemType": "Static", "path": ".../sandy.png", "slot": "stat1", "scale": "127%" },
    { "itemType": "Valid", "path": ".../turtle.png", "slot": "1,2,3" },
    { "itemType": "Drop", "slot": "drop1,drop2,drop3", "scale": "69%" },
    { "itemType": "Post", "behavior": "count" },
    { "itemType": "Instruction", "text": "How many turtles tall is Sandy? Drag turtles over to find out" },
    { "itemType": "Yay", "text": "Sandy is as tall as 3 turtles" }
  ]
}
```

---

## DDAnySlot

**Fill the slots; placement is free.** Any `Valid` item is accepted by any drop slot; `Bogus`
never is. Each slot still holds one item.

- Distinguisher in code: `LeafQuestionDDLayoutPage.cpp` `onTouchEnd()` line **378** —
  `m_question->questionType == "DDAnySlot"` short-circuits the slot-match check, so any valid item
  sticks in any open slot. Authoring giveaway: `Valid` items have **no** `slot`.

### 4.1 — Valid items accepted by any drop slot

`Drag-All.leaf.json` (101–158):

```json
{
  "name": "q3",
  "questionType": "DDAnySlot",
  "layout": ".../Drag/DDXYintoA4",
  "numValidItems": 2,
  "numTotalItems": 4,
  "numExtraItems": 2,
  "soundExt": "_silent",
  "comments": "DDAnySlot",
  "items": [
    { "itemType": "Valid", "path": ".../kodihats:kodihat9_thumb,kodihat7_thumb,kodihat50_thumb,kodihat3_thumb", "behavior": "wiggle1" },
    { "itemType": "Static", "path": ".../catCharStat.png", "slot": "drop1" },
    { "itemType": "Static", "path": ".../dogCharStat.png", "slot": "drop2" },
    { "itemType": "Background", "path": ".../bluebg.png" },
    { "itemType": "Drop", "slot": "drop1", "x": "46%", "y": "4%",  "scale": "60%" },
    { "itemType": "Drop", "slot": "drop2", "x": "51%", "y": "-6%", "scale": "60%" },
    { "itemType": "Instruction", "text": "give a hat to the cat and the dog" },
    { "itemType": "Yay", "text": "looking good" }
  ]
}
```

---

# Family 2 · Boxes drags

**Implementation:** `kkids/KinBoxK/Classes/Pages/LeafPages/LeafQuestionDDBoxesLayoutPage.cpp`

Behavioral differences from Family 1: items arranged into a row of boxes, **swap** on drop into a
full box, and the answer is checked on the **green submit button** rather than on drop.

Key type predicates (`LeafQuestionDDBoxesLayoutPage.cpp:1048–1060`):

```cpp
bool isAnyBoxes()  { return questionType == "DDAnyBoxes"; }
bool isBoxes()     { return questionType == "DDBoxes" || isFillBoxes(); }
bool isFillBoxes() { return questionType == "DDFillBoxes" || isAnyBoxes(); }
```

Note the layering: `DDAnyBoxes` ⊂ `isFillBoxes()` (it auto-resizes too), and
`DDFillBoxes` ⊂ `isBoxes()` (it grades like DDBoxes). `DDLetterBoxes` / `DDSoundBoxes` are none of
these predicates and fall to the order/audio-sequence branch.

Key methods:

- `onTouchEnd()` (~line 351): a dropped item is accepted into a slot only if the slot is a valid
  drop slot **or** `isAnyBoxes()` (lines **372** and **386**) — i.e. only `DDAnyBoxes` lets items
  land in "wrong" boxes.
- `dropDragItemIntoSlot()` (~line 412): the **swap** behavior — dropping onto a full slot boots
  the existing item back to the tray.
- `checkFillBox()` (~line 453): the **resize-to-box** behavior, active for `isFillBoxes()`.
- `itemsOrdered()` (~line 591): grading, branched by type:

  ```cpp
  if (isAnyBoxes())            // DDAnyBoxes: right boxes filled, wrong boxes empty (item identity ignored)
     ... // lines 593–602
  else if (isBoxes())          // DDBoxes / DDFillBoxes: specific item in specific box
     ... // lines 604–629
  else                         // DDLetterBoxes / DDSoundBoxes: ordered audio sequence must match
     return (concatCurrentAudioPaths() == concatTargetValidAudioPaths()); // line 633
  ```
- `concatCurrentAudioPaths()` / `concatTargetValidAudioPaths()` (~lines 886 / 910): build the
  current-vs-target audio-path sequences used for the letter/sound grading branch.

---

## DDBoxes

**Match specific items into specific boxes**, checked on submit. A `Valid` item's `slot` names the
accepted box(es) (`"drop1"` or `"1,3"`).

- Grading: `itemsOrdered()` `isBoxes()` branch, lines **604–629** — each valid slot must be filled
  by an item whose target slot matches (`kPropDropSlotTarget`, with `checkOtherDropSlots()`
  fallback for multi-slot items).

### 5.1 — One drop slot per Valid item

`LIT01cBeginningSounds_EN.asm.leaf.json` (2193–2287):

```json
{
  "name": "LIT1cV4-EN-q19-KG",
  "questionType": "DDBoxes",
  "layout": ".../3Boxes2Drop1Stat3Items",
  "numTotalItems": 3,
  "numValidItems": 2,
  "soundExt": "_word",
  "disable": "oops,multiTries,sparkles,exuberantKodi,scaling,enableNameItems",
  "comments": "ask: find '/b/' and '/I/' pom poms to complete 'bike'",
  "items": [
    { "itemType": "Background", "path": ".../reyalibrary.png" },
    { "itemType": "Valid", "path": ".../pompom5.png",  "audioPathText": "I Long Phonics", "itemSlot": "1", "slot": "drop2" },
    { "itemType": "Valid", "path": ".../pompom12.png", "audioPathText": "B Phonics",      "itemSlot": "2", "slot": "drop1" },
    { "itemType": "Bogus", "path": ".../pompom7.png",  "audioPathText": "M Phonics",      "itemSlot": "3" },
    { "itemType": "Static", "path": ".../pompom3.png", "audioPathText": "K Phonics", "slot": "stat4", "bgPath": ".../squareround9Dark.png" },
    { "itemType": "Static", "path": ".../bike.png", "slot": "stat1" },
    { "itemType": "Static", "path": ".../squareround9Dark.png", "slot": "stat2" },
    { "itemType": "Static", "path": ".../squareround9Dark.png", "slot": "stat3" },
    { "itemType": "Drop", "slot": "drop1" },
    { "itemType": "Instruction", "text": "Which pom poms make the word bike? Drag them to the boxes." },
    { "itemType": "Instruction", "text": "Press the green button when youre done." },
    { "itemType": "Yay",  "text": "Last question!" },
    { "itemType": "Oops", "text": "Last question!" }
  ]
}
```

### 5.2 — Multiple accepted drop slots per Valid item

`MAT07Patterns_EN.asm.leaf.json` (77–148). Comma-list `slot` (`"1,3"` / `"2,4"`) = item valid in any of those boxes:

```json
{
  "name": "MAT7V2-EN-p01-3YO",
  "questionType": "DDBoxes",
  "layout": ".../Drag/DD1SlotPerItem4by2",
  "numTotalItems": 4,
  "numValidItems": 4,
  "var1": "monsterstripedyellow", "var2": "monstertallred",
  "disable": "oops,thisIsHow",
  "dropSlotStyle": "DashBorder #light",
  "showSubmitButton": true,
  "comments": "ask: copy the AB pattern",
  "items": [
    { "itemType": "Instruction", "text": "Look carefully at the pattern and copy it below. ...Press the green button when youre done." },
    { "itemType": "Background", "path": ".../stargazingwhiteboxv3.png" },
    { "itemType": "Static", "path": ".../{var1}.png", "slot": "stat1,stat3", "bgPath": ".../squarestatic16.png" },
    { "itemType": "Static", "path": ".../{var2}.png", "slot": "stat2,stat4", "bgPath": ".../squarestatic16.png" },
    { "itemType": "Valid", "path": ".../{var1}.png", "slot": "1,3", "itemSlot": "1,2", "behavior": "wiggle1" },
    { "itemType": "Valid", "path": ".../{var2}.png", "slot": "2,4", "itemSlot": "3,4", "behavior": "wiggle1" },
    { "itemType": "Yay",  "text": "Yay! You copied the pattern. Tap me if you ever need help." },
    { "itemType": "Oops", "text": "Oops. That is not the same pattern. The pattern is yellow red yellow red. Try again." },
    { "itemType": "ThisIsHow", "text": "This is how you copy the pattern." }
  ]
}
```

---

## DDFillBoxes

**DDBoxes + auto-resize.** Identical grading to DDBoxes; the only difference is that a dropped
item resizes to fill its box.

- Code: `isFillBoxes()` is true (`:1058`), so `checkFillBox()` (~line 453) rescales the dropped
  item to the slot. Grading still flows through the `isBoxes()` branch of `itemsOrdered()`
  (since `isBoxes()` includes `isFillBoxes()`).

### 6.1 — Fill the boxes in order (sequencing)

`LIT04Retelling_EN.asm.leaf.json` (384–451):

```json
{
  "name": "LIT4V3-EN-q02-3YO",
  "questionType": "DDFillBoxes",
  "numTotalItems": 3,
  "numValidItems": 3,
  "layout": ".../DDSequence3S3",
  "dropSlotStyle": "DashBorder",
  "disable": "thisIsHow,oops,multiTries,sparkles,exuberantKodi",
  "comments": "ask: Move the pictures to retell the story.",
  "items": [
    { "itemType": "Instruction", "text": "Move the pictures to put the story in order. ...Tap the green button when you are done." },
    { "itemType": "Valid", "path": ".../SandysBandp1zoomed.png", "audioPathText": "Sandy wanted to start a band.",          "slot": "1", "itemSlot": "3", "bgPath": ".../WhiteBgSquare.png", "scale": "98" },
    { "itemType": "Valid", "path": ".../SandysBandp2zoomed.png", "audioPathText": "But her friends did not sound good.",      "slot": "2", "itemSlot": "1", "bgPath": ".../WhiteBgSquare.png", "scale": "98" },
    { "itemType": "Valid", "path": ".../SandysBandp3zoomed.png", "audioPathText": "After some practice they sounded much better.", "slot": "3", "itemSlot": "2", "bgPath": ".../WhiteBgSquare.png", "scale": "98" },
    { "itemType": "Static", "path": ".../lightarrowright.png", "slot": "stat1,stat2" },
    { "itemType": "Background", "path": ".../tablebrown2.png" },
    { "itemType": "Yay",  "text": "Keep it up." },
    { "itemType": "Oops", "text": "Keep it up." }
  ]
}
```

### 6.2 — Measure on a ruler (single box + distractors)

`CHF_MeasurementLayouts.leaf.json` (5–64):

```json
{
  "name": "q1 - leaf MAD_01_a",
  "questionType": "DDFillBoxes",
  "layout": ".../DDMeasure2Items1Drop1Static",
  "numValidItems": 1,
  "numTotalItems": 3,
  "showSubmitButton": true,
  "items": [
    { "itemType": "Background", "path": ".../Background:{var1}" },
    { "itemType": "Instruction", "text": "Drag the items to the top of the ruler... When you find the one that is 8 inches long, tap the green button" },
    { "itemType": "Static", "slot": "stat1", "path": ".../measure/ruler_inch.png" },
    { "itemType": "Valid", "slot": "drop1", "path": ".../measure:measure_8in_straw_full", "align": "Left", "scale": "200" },
    { "itemType": "Bogus", "path": ".../measure:measure_5in_pencil_full,measure_7in_paintbrush_full", "align": "Left", "scale": "200" },
    { "itemType": "Drop", "slot": "drop1" },
    { "itemType": "Yay",  "text": "Cool! You dragged the straw that is 8 inches long" },
    { "itemType": "Oops", "text": "Oops! That is not 8 inches long. Try something else." },
    { "itemType": "ThisIsHow", "text": "The straw is 8 inches long" }
  ]
}
```

---

## DDAnyBoxes

**Fill the right boxes; item identity is ignored.** Grades by *which* boxes end up filled vs empty,
not by which item is where. Also auto-resizes (it satisfies `isFillBoxes()`).

- Code: `isAnyBoxes()` (`:1048`). Drop acceptance allows any box (`onTouchEnd()` lines 372/386).
  Grading is the `isAnyBoxes()` branch of `itemsOrdered()` (lines **593–602**): every
  `kPropValidDropSlot` must be done, and every non-valid slot must be empty.

### 7.1 — Measure with blocks

`MAT08Measurement_EN.asm.leaf.json` (556–619):

```json
{
  "name": "MAT8V2-EN-q07-4YO",
  "questionType": "DDAnyBoxes",
  "layout": "test/holly/measurevertically4",
  "numTotalItems": 4,
  "numValidItems": 3,
  "numExtraItems": 1,
  "dropSlotStyle": "DashBorder",
  "disable": "oops,multiTries,sparkles,exuberantKodi,thisIsHow",
  "showSubmitButton": true,
  "comments": "ask: measure the boy with blocks",
  "items": [
    { "itemType": "Static", "path": ".../people/boy8.png", "slot": "stat1", "scale": "94", "y": "63" },
    { "itemType": "Valid", "path": ".../shape/squareround1.png", "slot": "1,2,3", "behavior": "wiggle1" },
    { "itemType": "Bogus", "path": ".../shape/squareround1.png", "slot": "4",     "behavior": "wiggle1" },
    { "itemType": "Drop",  "slot": "drop1,drop2,drop3" },
    { "itemType": "Instruction", "text": "How many blocks tall is the boy? ...Press the green button when youre done." },
    { "itemType": "Background", "path": ".../BG_Measurement_sidewalk-chalk.png" },
    { "itemType": "Yay",  "text": "Lets do another one!" },
    { "itemType": "Oops", "text": "Lets do another one!" }
  ]
}
```

`Valid slot "1,2,3"` marks the boxes that must be filled; `Bogus slot "4"` marks the box that must
stay empty. Both items use the same picture — the answer is a count, not a match.

---

## DDLetterBoxes

**Spell a word by ordering letter tiles.** Draggable items are text tiles; grading compares the
**ordered audio sequence** of placed tiles against the target word.

- Code: not `isBoxes()`/`isAnyBoxes()`, so `itemsOrdered()` hits the `else` branch (line **633**):
  `concatCurrentAudioPaths() == concatTargetValidAudioPaths()`. Requires
  `params: "itemsInOrder=true"` (base `LeafQuestionLayoutPage::itemsInOrder()`, ~line 2009).
  (`DDSoundBoxes` shares this branch.)

### 8.1 — Spell "herd"

`LetterBoxes.leaf.json` (3–61):

```json
{
  "name": "q1",
  "questionType": "DDLetterBoxes",
  "layout": ".../LetterBoxes3Image",
  "var1": "herd",
  "var2": "h",
  "var3": "er",
  "var4": "d",
  "numValidItems": 3,
  "numTotalItems": 3,
  "comments": "spell h-er-d",
  "items": [
    { "itemType": "Background", "path": ".../plantaseed.png" },
    { "itemType": "Static", "path": ".../Words/{var1}.png", "audioPath": ".../Words/{var1}_word.mp3", "slot": "stat2" },
    { "itemType": "Static", "path": ".../DDBoxes/junglelightgreen3box.png", "slot": "stat1" },
    { "itemType": "Valid", "text": "{var2},{var3},{var4}", "slot": "1,2,3", "audioPath": ".../{var2}phonics,{var3}phonics,{var4}phonics", "params": "itemsInOrder=true" },
    { "itemType": "Instruction", "text": "Spell the word. {var1}." },
    { "itemType": "Yay",  "text": "{currentOrder()}. that makes. {var1}. ..." },
    { "itemType": "Oops", "text": "Oops! This spells. {currentOrder()}. Try again." },
    { "itemType": "ThisIsHow", "text": "This is how you spell the word. {var1}. ..." }
  ]
}
```

One `Valid` entry defines all three tiles via comma-separated `text`/`slot`; `itemsInOrder=true`
makes order count; `{currentOrder()}` reads back what the child spelled in feedback.

---

# Quick reference

| questionType | Page class | Grading method / branch | Defining behavior |
|---|---|---|---|
| `DDXintoA` | `LeafQuestionDDLayoutPage` | drop-match, count to `getNumTarget()` (`onTouchEnd` ~455) | One accepted slot group |
| `DDXYintoAB` | `LeafQuestionDDLayoutPage` | drop-match (slot `1`/`2`) | Two accepted slot groups |
| `DD1SlotPerItem` | `LeafQuestionDDLayoutPage` | `checkOtherDropSlots()` per item (`onTouchEnd` 378–388) | One item per slot, matched |
| `DDAnySlot` | `LeafQuestionDDLayoutPage` | any valid item any slot (`onTouchEnd` 378) | Fill slots, placement free |
| `DDBoxes` | `LeafQuestionDDBoxesLayoutPage` | `itemsOrdered()` `isBoxes()` 604–629 | Match item→box, submit |
| `DDFillBoxes` | `LeafQuestionDDBoxesLayoutPage` | `isBoxes()` branch + `checkFillBox()` 453 | DDBoxes + resize to box |
| `DDAnyBoxes` | `LeafQuestionDDBoxesLayoutPage` | `itemsOrdered()` `isAnyBoxes()` 593–602 | Right boxes filled, identity ignored |
| `DDLetterBoxes` | `LeafQuestionDDBoxesLayoutPage` | `itemsOrdered()` else (audio seq) 633 | Spell word by ordered tiles |

### Key files

- `kkids/KinBoxK/Classes/Pages/LeafPages/LeafPage.cpp` — page routing (`getLeafChildPageType`, `createLeafChildPage`)
- `kkids/KinBoxK/Classes/Pages/LeafPages/LeafQuestionDDLayoutPage.cpp` — Family 1 (slot-based)
- `kkids/KinBoxK/Classes/Pages/LeafPages/LeafQuestionDDBoxesLayoutPage.cpp` — Family 2 (boxes)
- `kkids/KinBoxK/Classes/Pages/LeafPages/LeafQuestionLayoutPage.cpp` — shared base (items, `itemsInOrder`, feedback)
- `kkids/KinBoxK/Classes/FileCache/ContentMgr/ContentQuestion.cpp` — `isValid()` type allow-list
