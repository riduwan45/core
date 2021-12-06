package ipfs

import (
	"bytes"
	"fmt"
	"lido-cli/pkg/logs"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/pterm/pterm"
)

type IPFS struct {
	Cmd  *exec.Cmd
	Outb bytes.Buffer
	Errb bytes.Buffer
}

func (node *IPFS) Start() {
	s, _ := pterm.DefaultSpinner.Start("IPFS: Starting...")

	node.Cmd = exec.Command("ipfs", "daemon")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Start()
	if err != nil {
		log.Panic(err)
	}

	timeout := 10
	for {
		if logs.Verbose && node.Outb.String() != "" {
			fmt.Print(node.Outb.String())
		}

		if strings.Contains(node.Outb.String(), "Daemon is ready") {
			s.Success("IPFS: Started")
			fmt.Println()
			break
		}

		if strings.Contains(node.Errb.String(), "Error:") {
			s.Fail()
			fmt.Println(node.Errb.String())
			fmt.Println()
			break
		}

		node.Outb.Reset()
		node.Errb.Reset()

		time.Sleep(1 * time.Second)
		timeout--

		if timeout < 0 {
			s.UpdateText("Timeout error")
			s.Fail()
			panic("Timeout error")
		}
	}
}

func (node *IPFS) Stop() {
	if node.Cmd == nil || node.Cmd.Process == nil || node.Cmd.Process.Pid == 0 {
		return
	}
	s, _ := pterm.DefaultSpinner.Start("IPFS: Stopping...")
	node.Cmd.Process.Kill()
	node.Cmd = nil
	s.Success("IPFS: Stopped")
}
