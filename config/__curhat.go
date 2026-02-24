package main

import (
	"fmt"
	"time"
)

type HeartState int

const (
	Shattered HeartState = iota
	Healing
	Rebuilt
	Fortified
)

type MyHeart struct {
	painLevel float64
	state     HeartState
	WhatIGave string
	blacklist []string
}

func NewHeart() *MyHeart {
	return &MyHeart{
		painLevel: 100.0,
		state:     Shattered,
		WhatIGave: "Everything",
		blacklist: []string{"PAST_USER"},
	}
}

func (h *MyHeart) Release() {
	fmt.Println("\n\033[36m╔════════════════════════════════════╗")
	fmt.Println("║   NO REFUND POLICY IN EFFECT       ║")
	fmt.Println("╚════════════════════════════════════╝\033[0m")
	fmt.Printf("\n→ %s was given freely.\n", h.WhatIGave)
	fmt.Println("→ What's yours stays yours.")
	fmt.Println("→ I don't take back what I offered.\n")
}

func (h *MyHeart) Rebuild() {
	fmt.Println("[ Rebuilding... ]\n")
	for h.painLevel > 0 {
		h.painLevel -= 5
		if h.painLevel <= 75 {
			h.state = Healing
		}
		if h.painLevel <= 40 {
			h.state = Rebuilt
		}
		fmt.Printf("  ▓▓▓ %.0f%% complete\n", 100-h.painLevel)
		time.Sleep(150 * time.Millisecond)
	}
	h.state = Fortified
	fmt.Println("\n\033[32m✓ Heart Status: FORTIFIED")
	fmt.Println("✓ New version deployed.\033[0m")
}

func (h *MyHeart) ValidateAccess(userID string) error {
	for _, blocked := range h.blacklist {
		if blocked == userID {
			fmt.Println("\n\033[31m╔════════════════════════════════════╗")
			fmt.Println("║   ACCESS DENIED: ERROR 403         ║")
			fmt.Println("╚════════════════════════════════════╝\033[0m")
			return fmt.Errorf(
				"\nWhat you had was a limited edition.\n" +
					"Once gone, it's gone forever.\n" +
					"No replicas. No second chances.",
			)
		}
	}
	return nil
}

func main() {
	fmt.Print("\033[H\033[2J")
	heart := NewHeart()
	// Phase 1: Let Go
	heart.Release()
	time.Sleep(800 * time.Millisecond)
	// Phase 2: Heal
	heart.Rebuild()
	time.Sleep(500 * time.Millisecond)
	// Phase 3: The Truth
	if err := heart.ValidateAccess("PAST_USER"); err != nil {
		fmt.Println(err)
	}
	fmt.Println("\n\033[90m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println("  I came once. I won't come back.")
	fmt.Println("  Find me again? Impossible.")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m")
}
