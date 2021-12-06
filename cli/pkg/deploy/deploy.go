package deploy

import (
	"bytes"
	"fmt"
	"lido-cli/pkg/logs"
	"log"
	"os/exec"
	"strings"

	"github.com/pterm/pterm"
)

type Deploy struct {
	Cmd  *exec.Cmd
	Outb bytes.Buffer
	Errb bytes.Buffer

	DeployedFile *DeployedFile
}

type AppInfo struct {
	BaseAddress  string `json:"baseAddress"`
	FullName     string `json:"fullName"`
	Name         string `json:"name"`
	ID           string `json:"id"`
	IpfsCid      string `json:"ipfsCid"`
	ContentURI   string `json:"contentURI"`
	ProxyAddress string `json:"proxyAddress"`
}

type DeployedFile struct {
	DaoAddress               string  `json:"daoAddress"`
	AppLido                  AppInfo `json:"app:lido"`
	AppOracle                AppInfo `json:"app:oracle"`
	AppNodeOperatorsRegistry AppInfo `json:"app:node-operators-registry"`
}

func (node *Deploy) Start() error {

	if err := node.AragonEnv(); err != nil {
		return err
	}
	node.AragonStdApps()
	node.ApmAndTemplates()
	node.DeployApps()
	node.DeployDAO()

	return nil
}

func (node *Deploy) AragonEnv() error {
	s, _ := pterm.DefaultSpinner.Start("Deploy: Aragon env...")

	node.Cmd = exec.Command("yarn", "deploy:aragon-env")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Run()
	if err != nil {
		if strings.Contains(node.Errb.String(), "Error: Cannot create instance of ENS") {
			s.UpdateText("Error: Cannot create instance of ENS, remove deployed-localhost.json file and try again")
		}
		fmt.Print(node.Errb.String())
		s.Fail()
		return err
	}

	//need to use different buffers
	if logs.Verbose {
		fmt.Print(node.Outb.String())
		node.Outb.Reset()
	}

	s.Success("Deploy: Aragon env... done")

	return nil
}

func (node *Deploy) AragonStdApps() error {
	s, _ := pterm.DefaultSpinner.Start("Deploy: Aragon standart apps...")

	node.Cmd = exec.Command("yarn", "deploy:aragon-std-apps")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Run()
	if err != nil {
		return err
	}

	//need to use different buffers
	if logs.Verbose {
		fmt.Print(node.Outb.String())
		node.Outb.Reset()
	}

	s.Success("Deploy: Aragon standart apps... done")

	return nil
}

func (node *Deploy) ApmAndTemplates() {
	s, _ := pterm.DefaultSpinner.Start("Deploy: apm and template...")

	node.Cmd = exec.Command("yarn", "deploy:apm-and-template")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Run()
	if err != nil {
		log.Panic(err)
	}

	//need to use different buffers
	if logs.Verbose {
		fmt.Print(node.Outb.String())
		node.Outb.Reset()
	}

	s.Success("Deploy: apm and template... done")
}

func (node *Deploy) DeployApps() {
	s, _ := pterm.DefaultSpinner.Start("Deploy: lido apps...")

	node.Cmd = exec.Command("yarn", "deploy:apps")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Run()
	if err != nil {
		log.Panic(err)
	}

	//need to use different buffers
	if logs.Verbose {
		fmt.Print(node.Outb.String())
		node.Outb.Reset()
	}

	s.Success("Deploy: lido apps... done")
}

func (node *Deploy) DeployDAO() {
	s, _ := pterm.DefaultSpinner.Start("Deploy: DAO...")

	node.Cmd = exec.Command("yarn", "deploy:dao")
	node.Cmd.Stdout = &node.Outb
	node.Cmd.Stderr = &node.Errb
	err := node.Cmd.Run()
	if err != nil {
		log.Panic(err)
	}

	//need to use different buffers
	if logs.Verbose {
		fmt.Print(node.Outb.String())
		node.Outb.Reset()
	}

	s.Success("Deploy: DAO... done")
}
