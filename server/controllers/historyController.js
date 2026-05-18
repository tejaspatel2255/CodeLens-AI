import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.js';

const MOCK_TEMPLATES = [
  {
    id: "mock-c-sum",
    user_session: "mock-session",
    language: "C",
    original_code: `#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int y = 20;\n    int sum = x + y;\n    printf("Sum is %d\\n", sum);\n    return 0;\n}`,
    summary: "Calculates the sum of two integers and prints the result to standard output.",
    flow: "Allocates variables x and y on the stack, computes their sum, and displays the formatted result via standard console stream.",
    concepts: ["Variables", "Stack Allocation", "Console I/O", "Data Types"],
    optimizations: [
      "Declare constant variables as const if their values are never modified.",
      "Optimize stack allocations by reusing variable blocks in tight loops."
    ],
    steps: [
      {
        step: 1,
        line: "    int x = 10;",
        title: "Allocate Variable x",
        explanation: "Declares an integer variable named x and assigns it the initial value of 10.",
        backend: "Allocates 4 bytes of memory inside the current stack frame. The variable register binds 'x' to this location.",
        analogy: "Placing a labeled glass jar on a kitchen shelf and placing exactly 10 chocolate chips inside."
      },
      {
        step: 2,
        line: "    int y = 20;",
        title: "Allocate Variable y",
        explanation: "Declares an integer variable named y and assigns it the initial value of 20.",
        backend: "Allocates an adjacent 4 bytes of memory on the call stack frame directly beneath the variable x.",
        analogy: "Placing a second labeled jar on your shelf and placing exactly 20 chocolate chips inside."
      },
      {
        step: 3,
        line: "    int sum = x + y;",
        title: "Calculate Sum",
        explanation: "Retrieves the values of x and y, adds them together, and stores the resulting product in a new variable.",
        backend: "Loads the values of x and y into active CPU registers, routes them through the ALU for addition, and commits 30 to the 'sum' memory cell.",
        analogy: "Taking the cookies out of both labeled jars, mixing them together, and pouring them into a large storage bowl labeled 'sum'."
      },
      {
        step: 4,
        line: "    printf(\"Sum is %d\\n\", sum);",
        title: "Render Output",
        explanation: "Formats and prints the calculated integer value to the console stream.",
        backend: "Pushes the formatted text address and variable parameters to standard output (stdout) and flushes the buffer to the screen.",
        analogy: "Writing the final cookie count on a giant neon whiteboard for the entire kitchen staff to read."
      }
    ],
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "mock-cpp-ptr",
    user_session: "mock-session",
    language: "C++",
    original_code: `#include <iostream>\nusing namespace std;\n\nint main() {\n    int val = 42;\n    int* ptr = &val;\n    cout << "Pointer value: " << *ptr << endl;\n    return 0;\n}`,
    summary: "Demonstrates memory pointer referencing and dereferencing by printing a value through its hex address.",
    flow: "Allocates an integer on the stack, initializes a pointer pointing to its memory address, and displays it via indirection dereferencing.",
    concepts: ["Pointers", "Memory Addresses", "Indirection", "C++ Streams"],
    optimizations: [
      "Always initialize pointers to nullptr to avoid wild memory dereferences.",
      "Prefer references (int& ref) over raw pointers for cleaner scope management when dynamic allocation isn't required."
    ],
    steps: [
      {
        step: 1,
        line: "    int val = 42;",
        title: "Declare Value",
        explanation: "Creates a standard stack-allocated integer variable containing 42.",
        backend: "Pushes 4 bytes onto the call stack containing the binary representation of 42.",
        analogy: "Renting a small school locker named 'val' and placing a lucky token of 42 inside."
      },
      {
        step: 2,
        line: "    int* ptr = &val;",
        title: "Create Pointer",
        explanation: "Creates a pointer named ptr and assigns it the physical hexadecimal address of val.",
        backend: "Allocates 8 bytes of stack memory (on 64-bit platforms) to store the physical memory address (e.g. 0x7FFD28C0) of val.",
        analogy: "Writing the exact street address of locker 'val' onto a tiny sticky note labeled 'ptr'."
      },
      {
        step: 3,
        line: "    cout << \"Pointer value: \" << *ptr << endl;",
        title: "Dereference & Print",
        explanation: "Accesses the value inside the memory location pointed to by ptr and prints it.",
        backend: "Performs indirection: resolves the memory address in 'ptr', fetches the value from that cell, and pushes it to stdout.",
        analogy: "Reading the street address written on your sticky note, driving to that locker, unlocking it, and revealing the lucky token inside!"
      }
    ],
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "mock-python-list",
    user_session: "mock-session",
    language: "Python",
    original_code: `numbers = [1, 2, 3]\nsquares = [n * n for n in numbers]\nprint(squares)`,
    summary: "Creates a dynamic list and squares each number using a highly readable list comprehension routine.",
    flow: "Instantiates a dynamic array list, maps over the references to compute squared values in a local scope, and outputs the resulting list.",
    concepts: ["List Comprehension", "Dynamic Arrays", "Iterators", "Heap Pointers"],
    optimizations: [
      "For massive arrays, use a generator expression (n*n for n in numbers) to lazily yield elements without full heap allocation.",
      "Pre-allocate lists using sizing multipliers if you are loading huge array buffers."
    ],
    steps: [
      {
        step: 1,
        line: "numbers = [1, 2, 3]",
        title: "Define Numbers List",
        explanation: "Creates a dynamic list containing three integer values.",
        backend: "Allocates heap space for a list array structure containing pointers pointing to 3 distinct integer objects in memory.",
        analogy: "Placing three apples inside a dynamic expandable container drawer labeled 'numbers'."
      },
      {
        step: 2,
        line: "squares = [n * n for n in numbers]",
        title: "Compute Squares Comprehension",
        explanation: "Loops through numbers, squares each integer, and compiles the squared values into a new list.",
        backend: "Loops through list pointers, multiplies values in local environment frame registers, and instantiates a new list.",
        analogy: "An assembly linesman taking an apple from each drawer slot, making a copy, slicing it into square blocks, and placing it into a second drawer."
      },
      {
        step: 3,
        line: "print(squares)",
        title: "Output Array",
        explanation: "Converts the squares list to a readable text representation and prints it.",
        backend: "Serializes the list container into string format and writes it directly to standard system console output.",
        analogy: "Wheeling the second drawer out to the showroom floor so visitors can view the square apple slices."
      }
    ],
    created_at: new Date(Date.now() - 10800000).toISOString()
  },
  {
    id: "mock-java-method",
    user_session: "mock-session",
    language: "Java",
    original_code: `public class Demo {\n    public static void main(String[] args) {\n        int res = multiply(3, 4);\n        System.out.println("Result: " + res);\n    }\n    public static int multiply(int a, int b) {\n        return a * b;\n    }\n}`,
    summary: "Invokes a static multiplication method inside a class structure and displays the product to standard out.",
    flow: "Enters the main program entrypoint frame, passes parameters to a dedicated static helper frame, and outputs the return value.",
    concepts: ["Class Structures", "Static Methods", "JVM Activation Records", "Return Values"],
    optimizations: [
      "Avoid excessive boxing by sticking to standard JVM primitive types (int, float) rather than wrappers (Integer, Float).",
      "Let the Just-In-Time (JIT) compiler compile hot routines to direct machine instructions."
    ],
    steps: [
      {
        step: 1,
        line: "    public static void main(String[] args) {",
        title: "Enter main Frame",
        explanation: "Enters the JVM main method entrypoint to initiate execution.",
        backend: "JVM allocates a dedicated activation stack frame for main, setting program counter registers.",
        analogy: "Entering the central CEO executive room to sign off on a new calculation order."
      },
      {
        step: 2,
        line: "        int res = multiply(3, 4);",
        title: "Invoke Method call",
        explanation: "Calls the multiply method, sending the arguments 3 and 4.",
        backend: "Pushes call parameters onto the thread stack, preparing to branch instruction control.",
        analogy: "Writing a calculation order slip for 3 and 4, and sending it down the hallway to a specialist assistant."
      },
      {
        step: 3,
        line: "    public static int multiply(int a, int b) {",
        title: "Enter multiply Frame",
        explanation: "Allocates parameters inside the multiply method scope.",
        backend: "Pushes a new activation record (stack frame) for multiply. Resolves arguments 'a' (3) and 'b' (4) locally.",
        analogy: "The assistant in the calculator room opening their desk and taking out slots for inputs a (3) and b (4)."
      },
      {
        step: 4,
        line: "        return a * b;",
        title: "Compute & Return",
        explanation: "Multiplies both inputs and sends the resulting number back to the main caller.",
        backend: "Computes ALU multiplication, pops the multiply frame off the call stack, and places 12 on top for main.",
        analogy: "The assistant multiplying the values, writing down 12, tearing up their local work sheet, and passing the result back to the CEO room."
      },
      {
        step: 5,
        line: "        System.out.println(\"Result: \" + res);",
        title: "Print Console Line",
        explanation: "Outputs the string Result: 12 to the computer terminal console.",
        backend: "Calls system PrintStream buffer stream, concatenates strings, and sends bytes to stdout.",
        analogy: "Using the building megaphone to broadcast 'Result: 12' to the entire office floor."
      }
    ],
    created_at: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: "mock-javascript-scope",
    user_session: "mock-session",
    language: "JavaScript",
    original_code: `let factor = 2;\nfunction double(val) {\n    return val * factor;\n}\nconst result = double(8);\nconsole.log(result);`,
    summary: "Executes a function referencing an outer lexical context block scope to double a number.",
    flow: "Allocates factor globally, declares a closure function, pushes the frame to double the input argument, and logs the value.",
    concepts: ["Lexical Environments", "Closures", "Function Invocation", "JavaScript Engine"],
    optimizations: [
      "Declare variables as const instead of let if their values are static, enabling aggressive compiler optimization.",
      "Minimize global environment properties to reduce closure scope resolution overhead."
    ],
    steps: [
      {
        step: 1,
        line: "let factor = 2;",
        title: "Initialize Global factor",
        explanation: "Creates a variable named factor and sets it to 2.",
        backend: "Creates a slot inside the execution environment record of the V8 JavaScript script engine.",
        analogy: "Hanging up a public clock on the wall set to 2 hours."
      },
      {
        step: 2,
        line: "function double(val) {",
        title: "Declare function closure",
        explanation: "Creates a callable function containing active references to its lexical scope context.",
        backend: "Instantiates a function object inside the JS Heap memory containing a reference to the outer script scope context.",
        analogy: "Writing down a calculation recipe in a master guidebook."
      },
      {
        step: 3,
        line: "const result = double(8);",
        title: "Call double Function",
        explanation: "Calls the double function sending 8 to compute the value.",
        backend: "Pushes 'double' onto the Call Stack. Resolves 'factor' (2) by traversing the closure reference link to outer scope.",
        analogy: "Opening the guidebook, taking out a temporary workspace paper, noting val is 8, looking up at the public wall clock to read factor (2), and computing 16."
      },
      {
        step: 4,
        line: "console.log(result);",
        title: "Log Result",
        explanation: "Prints the final value of 16 to the console interface.",
        backend: "Writes 16 to runtime stdio and calls standard terminal stream printing.",
        analogy: "Pasting the number 16 on the shared company billboard."
      }
    ],
    created_at: new Date(Date.now() - 18000000).toISOString()
  }
];

export const getHistory = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // 1. Check if this sessionId belongs to an authenticated user
    const { data: userRecord } = await supabase
      .from('codelens_users')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    // If it belongs to a registered user, enforce strict JWT validation
    if (userRecord) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access Denied: Authentication session token required.' });
      }

      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'codelens-ai-super-secret-key-2026';
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.id !== sessionId) {
          return res.status(403).json({ error: 'Access Denied: You are not authorized to view this trace history.' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Access Denied: Session token is invalid or expired.' });
      }
    }

    // 2. Fetch the corresponding history logs
    const { data, error } = await supabase
      .from('code_analyses')
      .select('*')
      .eq('user_session', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Dynamic Onboarding Deduplication: 
    // Filter out default mock templates if the user already has their own custom scanned history for that language!
    const scannedLanguages = new Set((data || []).map(item => item.language.toUpperCase()));
    const filteredMocks = MOCK_TEMPLATES.filter(mock => !scannedLanguages.has(mock.language.toUpperCase()));

    const merged = [...(data || []), ...filteredMocks];
    return res.status(200).json(merged);
  } catch (error) {
    console.error('History Controller Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while fetching analysis history.' });
  }
};

export const getAnalysisById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Analysis ID is required' });
  }

  try {
    // Check inside local mock templates first
    const mockMatch = MOCK_TEMPLATES.find(m => m.id === id);
    if (mockMatch) {
      return res.status(200).json(mockMatch);
    }

    const { data, error } = await supabase
      .from('code_analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Analysis by ID Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while fetching the shared analysis.' });
  }
};

export const deleteAnalysis = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Analysis ID is required' });
  }

  try {
    // Intercept mock templates to let the frontend delete them cleanly!
    if (id.startsWith('mock-')) {
      return res.status(200).json({ success: true, message: 'Mock template deleted locally.' });
    }

    // 1. Fetch analysis details to verify ownership
    const { data: analysis, error: fetchErr } = await supabase
      .from('code_analyses')
      .select('user_session')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis log not found.' });
    }

    const sessionId = analysis.user_session;

    // 2. Check if this sessionId belongs to an authenticated user
    const { data: userRecord } = await supabase
      .from('codelens_users')
      .select('id')
      .eq('id', sessionId)
      .maybeSingle();

    // If it belongs to a registered user, enforce strict JWT validation to verify ownership
    if (userRecord) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access Denied: Authentication session token required to delete logs.' });
      }

      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET || 'codelens-ai-super-secret-key-2026';
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.id !== sessionId) {
          return res.status(403).json({ error: 'Access Denied: You are not authorized to delete this trace history.' });
        }
      } catch (err) {
        return res.status(401).json({ error: 'Access Denied: Session token is invalid or expired.' });
      }
    }

    // 3. Delete the history log row
    const { error: deleteErr } = await supabase
      .from('code_analyses')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    return res.status(200).json({ message: 'Analysis history log deleted successfully!' });
  } catch (error) {
    console.error('Delete Analysis Error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while deleting the analysis.' });
  }
};
